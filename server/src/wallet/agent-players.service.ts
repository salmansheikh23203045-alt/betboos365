import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { parseRoles } from '../common/utils/roles';
import { WALLET_CONFIG } from './wallet.config';

const STAFF_ROLES = new Set(['super_admin', 'admin', 'sub_admin', 'agent', 'moderator']);
const DAY_MS = 86_400_000;
const n = (v: Prisma.Decimal | number | null | undefined) => Number(v ?? 0);
const isStaff = (roles: unknown) => (parseRoles(roles) as string[]).some((r) => STAFF_ROLES.has(r));

/** "+8801712345678" -> "+88017•••••678". Agents never see a player's full number here. */
export function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 7) return '•'.repeat(phone.length);
  return phone.slice(0, 6) + '•'.repeat(phone.length - 9) + phone.slice(-3);
}

/**
 * Players linked to an agent through users.agent_id.
 *
 *  - Agents read only their own players (every query is filtered by the
 *    calling agent's id; another agent's player answers 404, not 403, so
 *    existence is not revealed). Read-only: no balances, no transaction
 *    references, masked phone numbers.
 *  - Admins with agents.manage assign and unassign players; every change is
 *    audited with the previous agent.
 *
 * No commission is computed: the business has no commission rules defined.
 */
@Injectable()
export class AgentPlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ── Agent side ────────────────────────────────────────────

  async listForAgent(agentId: string, q: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(50, Math.max(1, q.limit ?? 20));
    const where: Prisma.UserWhereInput = { agentId };
    const search = q.search?.trim().toLowerCase();
    if (search) where.username = { contains: search };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, username: true, phone: true, phoneVerifiedAt: true, isActive: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    const ids = rows.map((r) => r.id);
    const [deps, wds] = ids.length
      ? await this.prisma.$transaction([
          this.prisma.depositRequest.groupBy({
            by: ['userId'],
            where: { userId: { in: ids }, status: TransactionStatus.APPROVED },
            _sum: { amount: true },
            _count: { _all: true },
            orderBy: { userId: 'asc' },
          }),
          this.prisma.withdrawalRequest.groupBy({
            by: ['userId'],
            where: { userId: { in: ids }, status: TransactionStatus.COMPLETED },
            _sum: { amount: true },
            _count: { _all: true },
            orderBy: { userId: 'asc' },
          }),
        ])
      : [[], []];
    const dep = new Map(deps.map((d) => [d.userId, d]));
    const wd = new Map(wds.map((w) => [w.userId, w]));

    return {
      data: rows.map((r) => {
        const d = dep.get(r.id);
        const w = wd.get(r.id);
        const dc = d?._count;
        const wc = w?._count;
        return {
          id: r.id,
          username: r.username,
          phone: maskPhone(r.phone),
          phoneVerified: Boolean(r.phoneVerifiedAt),
          isActive: r.isActive,
          joinedAt: r.createdAt.toISOString(),
          deposits: { count: typeof dc === 'object' ? dc._all ?? 0 : 0, amount: n(d?._sum?.amount) },
          withdrawals: { count: typeof wc === 'object' ? wc._all ?? 0 : 0, amount: n(w?._sum?.amount) },
        };
      }),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
      currency: WALLET_CONFIG.currency,
    };
  }

  async playerForAgent(agentId: string, playerId: string) {
    const player = await this.prisma.user.findFirst({
      where: { id: playerId, agentId },
      select: { id: true, username: true, phone: true, phoneVerifiedAt: true, isActive: true, createdAt: true },
    });
    if (!player) throw new NotFoundException('Player not found.');
    const [deposits, withdrawals] = await this.prisma.$transaction([
      this.prisma.depositRequest.findMany({
        where: { userId: playerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, amount: true, status: true, createdAt: true, provider: { select: { name: true } } },
      }),
      this.prisma.withdrawalRequest.findMany({
        where: { userId: playerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, amount: true, status: true, createdAt: true, provider: { select: { name: true } } },
      }),
    ]);
    const shape = (r: { id: string; amount: Prisma.Decimal; status: TransactionStatus; createdAt: Date; provider: { name: string } }) => ({
      id: r.id,
      amount: n(r.amount),
      status: r.status,
      provider: r.provider.name,
      createdAt: r.createdAt.toISOString(),
    });
    return {
      id: player.id,
      username: player.username,
      phone: maskPhone(player.phone),
      phoneVerified: Boolean(player.phoneVerifiedAt),
      isActive: player.isActive,
      joinedAt: player.createdAt.toISOString(),
      currency: WALLET_CONFIG.currency,
      deposits: deposits.map(shape),
      withdrawals: withdrawals.map(shape),
    };
  }

  async reportForAgent(agentId: string, days: number) {
    const span = [7, 30, 90].includes(days) ? days : 30;
    const since = new Date(Date.now() - span * DAY_MS);
    const mine = { completedById: agentId, status: TransactionStatus.COMPLETED };
    const myPlayers = { user: { agentId } };

    const [paidAll, paidSpan, awaiting, returned, players, newPlayers, playerDeps, playerWds, daily] =
      await this.prisma.$transaction([
        this.prisma.withdrawalRequest.aggregate({ where: mine, _sum: { amount: true }, _count: { _all: true } }),
        this.prisma.withdrawalRequest.aggregate({
          where: { ...mine, completedAt: { gte: since } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: { assignedAgentId: agentId, status: TransactionStatus.APPROVED },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.auditLog.count({
          where: {
            userId: agentId,
            action: AuditAction.WITHDRAWAL_ASSIGNED,
            timestamp: { gte: since },
            metadata: { path: '$.action', equals: 'returned_by_agent' },
          },
        }),
        this.prisma.user.count({ where: { agentId } }),
        this.prisma.user.count({ where: { agentId, createdAt: { gte: since } } }),
        this.prisma.depositRequest.aggregate({
          where: { ...myPlayers, status: TransactionStatus.APPROVED, processedAt: { gte: since } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.withdrawalRequest.aggregate({
          where: { ...myPlayers, status: TransactionStatus.COMPLETED, completedAt: { gte: since } },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.$queryRaw<{ d: string; total: Prisma.Decimal; cnt: bigint }[]>`
          SELECT DATE_FORMAT(completed_at, '%Y-%m-%d') AS d, SUM(amount) AS total, COUNT(*) AS cnt
          FROM withdrawal_requests
          WHERE status = 'COMPLETED' AND completed_by_id = ${agentId} AND completed_at >= ${since}
          GROUP BY d`,
      ]);

    const byDay = new Map<string, { amount: number; count: number }>();
    for (let i = span - 1; i >= 0; i--) {
      byDay.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), { amount: 0, count: 0 });
    }
    daily.forEach((r) => byDay.has(r.d) && byDay.set(r.d, { amount: n(r.total), count: Number(r.cnt) }));
    const cnt = (c: unknown) => (typeof c === 'object' && c && '_all' in c ? Number((c as { _all: number })._all) : 0);

    return {
      currency: WALLET_CONFIG.currency,
      days: span,
      payouts: {
        allTime: { count: cnt(paidAll._count), amount: n(paidAll._sum?.amount) },
        period: { count: cnt(paidSpan._count), amount: n(paidSpan._sum?.amount) },
        awaiting: { count: cnt(awaiting._count), amount: n(awaiting._sum?.amount) },
        returnedInPeriod: returned,
      },
      players: {
        total: players,
        joinedInPeriod: newPlayers,
        depositsInPeriod: { count: cnt(playerDeps._count), amount: n(playerDeps._sum?.amount) },
        withdrawalsInPeriod: { count: cnt(playerWds._count), amount: n(playerWds._sum?.amount) },
      },
      series: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
      commission: {
        configured: false,
        note: 'No commission rules have been set up for agents, so no commission is calculated.',
      },
    };
  }

  // ── Admin side ────────────────────────────────────────────

  private async requireAgent(agentId: string) {
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, username: true, roles: true, isActive: true },
    });
    const roles = agent ? (parseRoles(agent.roles) as string[]) : [];
    if (!agent || !roles.includes('agent') || roles.includes('admin') || roles.includes('super_admin')) {
      throw new NotFoundException('Agent not found.');
    }
    return agent;
  }

  async listForAdmin(agentId: string) {
    await this.requireAgent(agentId);
    const rows = await this.prisma.user.findMany({
      where: { agentId },
      orderBy: { username: 'asc' },
      take: 500,
      select: { id: true, username: true, isActive: true, createdAt: true },
    });
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  async assign(actorId: string, agentId: string, username: string) {
    const agent = await this.requireAgent(agentId);
    if (!agent.isActive) throw new BadRequestException('This agent is deactivated. Reactivate it before assigning players.');
    const player = await this.prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
      select: { id: true, username: true, roles: true, agentId: true },
    });
    if (!player) throw new NotFoundException(`No player named "${username.trim()}".`);
    if (isStaff(player.roles)) throw new BadRequestException('Only player accounts can be assigned to an agent.');
    if (player.agentId === agentId) throw new ConflictException(`${player.username} is already assigned to this agent.`);

    await this.prisma.user.update({ where: { id: player.id }, data: { agentId } });
    await this.audit.log(AuditAction.ADMIN_ACTION, actorId, {
      action: 'agent_player_assigned',
      agentId,
      targetUserId: player.id,
      previousAgentId: player.agentId,
    });
    return { id: player.id, username: player.username, agentId, previousAgentId: player.agentId };
  }

  async unassign(actorId: string, agentId: string, playerId: string) {
    await this.requireAgent(agentId);
    const moved = await this.prisma.user.updateMany({ where: { id: playerId, agentId }, data: { agentId: null } });
    if (moved.count === 0) throw new NotFoundException('That player is not assigned to this agent.');
    await this.audit.log(AuditAction.ADMIN_ACTION, actorId, {
      action: 'agent_player_unassigned',
      agentId,
      targetUserId: playerId,
    });
    return { id: playerId, agentId: null };
  }
}
