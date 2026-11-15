import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, TransactionStatus, WalletLedgerType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { parseRoles } from '../common/utils/roles';
import { WALLET_CONFIG } from './wallet.config';

// Wallets that may be credited/debited by hand: players, and agents (an agent's
// own balance is funded only this way; no commission is calculated anywhere).
// Admin-level and moderator accounts never hold an adjustable wallet.
const NON_ADJUSTABLE = new Set(['super_admin', 'admin', 'sub_admin', 'moderator']);
const adjustable = (roles: unknown) => !(parseRoles(roles) as string[]).some((r) => NON_ADJUSTABLE.has(r));
const ADJUST_MAX = 100_000;
const DAY_MS = 86_400_000;

const n = (v: Prisma.Decimal | number | null | undefined) => Number(v ?? 0);

export interface AdjustInput {
  direction: 'credit' | 'debit';
  amount: number;
  reason: string;
  idempotencyKey: string;
}

/**
 * Read-only finance reporting for the Admin Dashboard, plus the one write:
 * a manual wallet adjustment. Every figure here is computed from the
 * database; nothing is estimated.
 */
@Injectable()
export class AdminLedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Money totals and a daily series of approved deposits and paid-out withdrawals. */
  async overview(days: number) {
    const span = [1, 7, 30, 90].includes(days) ? days : 7;
    const since = new Date(Date.now() - span * DAY_MS);

    const [
      depAll,
      depSpan,
      wdAll,
      wdSpan,
      wdPending,
      depPending,
      bonuses,
      balances,
      adjust,
      depDaily,
      wdDaily,
    ] = await this.prisma.$transaction([
      // One batch on one connection, not eleven parallel connections: shared
      // MySQL hosting caps connections per user, and a burst can be refused.
      this.prisma.depositRequest.aggregate({
        where: { status: TransactionStatus.APPROVED },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.depositRequest.aggregate({
        where: { status: TransactionStatus.APPROVED, processedAt: { gte: since } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: TransactionStatus.COMPLETED },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: TransactionStatus.COMPLETED, completedAt: { gte: since } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED] } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.depositRequest.aggregate({
        where: { status: TransactionStatus.PENDING },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.bonusClaim.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.wallet.aggregate({ _sum: { availableBalance: true, reservedBalance: true } }),
      this.prisma.walletTransaction.groupBy({
        by: ['type'],
        where: { type: { in: [WalletLedgerType.ADJUSTMENT_CREDIT, WalletLedgerType.ADJUSTMENT_DEBIT] } },
        _sum: { amount: true },
        orderBy: { type: 'asc' },
      }),
      this.prisma.$queryRaw<{ d: string; total: Prisma.Decimal; cnt: bigint }[]>`
        SELECT DATE_FORMAT(processed_at, '%Y-%m-%d') AS d, SUM(amount) AS total, COUNT(*) AS cnt
        FROM deposit_requests
        WHERE status = 'APPROVED' AND processed_at >= ${since}
        GROUP BY d`,
      this.prisma.$queryRaw<{ d: string; total: Prisma.Decimal; cnt: bigint }[]>`
        SELECT DATE_FORMAT(completed_at, '%Y-%m-%d') AS d, SUM(amount) AS total, COUNT(*) AS cnt
        FROM withdrawal_requests
        WHERE status = 'COMPLETED' AND completed_at >= ${since}
        GROUP BY d`,
    ]);

    // One row per calendar day (UTC, matching the database's DATE()), zero-filled.
    const byDay = new Map<string, { deposits: number; withdrawals: number }>();
    for (let i = span - 1; i >= 0; i--) {
      byDay.set(new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10), { deposits: 0, withdrawals: 0 });
    }
    depDaily.forEach((r) => byDay.has(r.d) && (byDay.get(r.d)!.deposits = n(r.total)));
    wdDaily.forEach((r) => byDay.has(r.d) && (byDay.get(r.d)!.withdrawals = n(r.total)));

    const adjCredit = n(adjust.find((a) => a.type === WalletLedgerType.ADJUSTMENT_CREDIT)?._sum?.amount);
    const adjDebit = n(adjust.find((a) => a.type === WalletLedgerType.ADJUSTMENT_DEBIT)?._sum?.amount);

    return {
      currency: WALLET_CONFIG.currency,
      days: span,
      allTime: {
        deposits: { amount: n(depAll._sum.amount), count: depAll._count._all },
        withdrawals: { amount: n(wdAll._sum.amount), count: wdAll._count._all },
        netCashFlow: n(depAll._sum.amount) - n(wdAll._sum.amount),
        bonuses: { amount: n(bonuses._sum.amount), count: bonuses._count._all },
        adjustments: { credit: adjCredit, debit: adjDebit },
      },
      period: {
        deposits: { amount: n(depSpan._sum.amount), count: depSpan._count._all },
        withdrawals: { amount: n(wdSpan._sum.amount), count: wdSpan._count._all },
        netCashFlow: n(depSpan._sum.amount) - n(wdSpan._sum.amount),
      },
      pending: {
        deposits: { amount: n(depPending._sum.amount), count: depPending._count._all },
        withdrawals: { amount: n(wdPending._sum.amount), count: wdPending._count._all },
      },
      playerBalances: {
        available: n(balances._sum.availableBalance),
        reserved: n(balances._sum.reservedBalance),
      },
      series: [...byDay.entries()].map(([date, v]) => ({ date, ...v })),
    };
  }

  /** Every wallet movement, newest first, optionally filtered. */
  async ledger(q: { page?: number; limit?: number; type?: string; username?: string }) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 25));
    const where: Prisma.WalletTransactionWhereInput = {};
    if (q.type && (Object.values(WalletLedgerType) as string[]).includes(q.type)) {
      where.type = q.type as WalletLedgerType;
    }
    if (q.username) {
      const u = await this.prisma.user.findUnique({
        where: { username: q.username.trim().toLowerCase() },
        select: { id: true },
      });
      if (!u) return { data: [], meta: { total: 0, page, limit, totalPages: 1 } };
      where.userId = u.id;
    }
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    // Usernames looked up separately: one ledger row can never break the page.
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(rows.map((r) => r.userId))] } },
      select: { id: true, username: true },
    });
    const nameOf = new Map(users.map((u) => [u.id, u.username]));
    return {
      data: rows.map((t) => ({
        id: t.id,
        userId: t.userId,
        username: nameOf.get(t.userId) ?? '(deleted account)',
        type: t.type,
        amount: n(t.amount),
        balanceAfter: n(t.balanceAfter),
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  /** One player's wallet and latest movements. */
  async userWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, roles: true, isActive: true, wallet: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    const recent = await this.ledger({ username: user.username, page: 1, limit: 20 });
    const roles = parseRoles(user.roles) as string[];
    const isAgent = roles.includes('agent');
    const isPlayer = !isAgent && adjustable(roles);
    return {
      userId: user.id,
      username: user.username,
      isActive: user.isActive,
      isPlayer,
      isAgent,
      adjustable: adjustable(roles),
      currency: user.wallet?.currency ?? WALLET_CONFIG.currency,
      availableBalance: n(user.wallet?.availableBalance),
      reservedBalance: n(user.wallet?.reservedBalance),
      recent: recent.data,
      adjustLimit: ADJUST_MAX,
    };
  }

  /**
   * Manual correction of a player's available balance. Atomic with its ledger
   * entry, never below zero, idempotent per key, audited with the reason.
   */
  async adjust(actorId: string, userId: string, input: AdjustInput, ip?: string, ua?: string) {
    if (actorId === userId) throw new ForbiddenException('You cannot adjust your own wallet.');
    const amount = Math.round(input.amount * 100) / 100;
    if (!(amount > 0) || amount > ADJUST_MAX) {
      throw new BadRequestException(`Amount must be between 0.01 and ${ADJUST_MAX.toLocaleString('en-US')}.`);
    }
    const reason = input.reason.trim();

    const target = await this.prisma.user.findUnique({ where: { id: userId }, select: { roles: true } });
    if (!target) throw new NotFoundException('User not found.');
    if (!adjustable(target.roles)) {
      throw new ForbiddenException('Only player and agent wallets can be adjusted.');
    }

    const type = input.direction === 'credit' ? WalletLedgerType.ADJUSTMENT_CREDIT : WalletLedgerType.ADJUSTMENT_DEBIT;
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, currency: WALLET_CONFIG.currency },
      });
      // Lock the wallet row so concurrent adjustments run one at a time and the
      // idempotency check below cannot race.
      const [locked] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM wallets WHERE user_id = ${userId} FOR UPDATE`;

      // Locking read, so an adjustment committed while we waited is seen.
      const [hit] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM wallet_transactions
        WHERE wallet_id = ${locked.id} AND reference_type = 'ADJUSTMENT' AND reference_id = ${input.idempotencyKey}
        LIMIT 1 FOR UPDATE`;
      const replay = hit ? await tx.walletTransaction.findUniqueOrThrow({ where: { id: hit.id } }) : null;
      if (replay) return { replayed: true, tx: replay };

      if (type === WalletLedgerType.ADJUSTMENT_DEBIT) {
        const debited = await tx.wallet.updateMany({
          where: { id: locked.id, availableBalance: { gte: amount } },
          data: { availableBalance: { decrement: amount }, version: { increment: 1 } },
        });
        if (debited.count === 0) {
          throw new ConflictException('The player does not have enough available balance for this debit.');
        }
      } else {
        await tx.wallet.update({
          where: { id: locked.id },
          data: { availableBalance: { increment: amount }, version: { increment: 1 } },
        });
      }
      const after = await tx.wallet.findUniqueOrThrow({ where: { id: locked.id } });
      const entry = await tx.walletTransaction.create({
        data: {
          walletId: locked.id,
          userId,
          type,
          amount,
          balanceAfter: after.availableBalance,
          referenceType: 'ADJUSTMENT',
          referenceId: input.idempotencyKey,
          description: `Admin adjustment: ${reason}`.slice(0, 190),
        },
      });
      return { replayed: false, tx: entry };
    });

    if (!result.replayed) {
      await this.audit.log(
        AuditAction.ADMIN_ACTION,
        actorId,
        {
          action: 'wallet_adjusted',
          targetUserId: userId,
          direction: input.direction,
          amount,
          reason,
          ledgerId: result.tx.id,
        },
        ip,
        ua,
      );
    }
    return {
      ledgerId: result.tx.id,
      replayed: result.replayed,
      type: result.tx.type,
      amount: n(result.tx.amount),
      balanceAfter: n(result.tx.balanceAfter),
    };
  }
}
