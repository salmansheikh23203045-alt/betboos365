import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuditAction,
  Prisma,
  TransactionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WalletService, InsufficientBalanceError } from './wallet.service';
import {
  AdminDecisionDto,
  CompleteWithdrawalDto,
  CreateWithdrawalDto,
} from './dto';
import { WALLET_CONFIG } from './wallet.config';
import { withdrawalView, WithdrawalView } from './shape';
import { normalizeBdPhone } from '../common/utils/phone';
import { parseRoles } from '../common/utils/roles';
import { Role } from '../common/interfaces';

const STAFF_INCLUDE = {
  provider: true,
  user: { select: { id: true, username: true, roles: true } },
  assignedAgent: { select: { id: true, username: true } },
  processedBy: { select: { id: true, username: true } },
  completedBy: { select: { id: true, username: true } },
} satisfies Prisma.WithdrawalRequestInclude;

type StaffRow = Prisma.WithdrawalRequestGetPayload<{ include: typeof STAFF_INCLUDE }>;

function staffView(w: StaffRow) {
  const ref = (u: { id: string; username: string } | null) =>
    u ? { id: u.id, username: u.username } : null;
  return {
    ...withdrawalView(w),
    user: ref(w.user),
    // Reviewers see at a glance that this is an agent's own payout request.
    requesterIsAgent: w.user ? (parseRoles(w.user.roles) as string[]).includes(Role.AGENT) : false,
    assignedAgent: ref(w.assignedAgent),
    assignedAt: w.assignedAt ? w.assignedAt.toISOString() : null,
    processedBy: ref(w.processedBy),
    completedBy: ref(w.completedBy),
  };
}

export type StaffWithdrawalView = ReturnType<typeof staffView>;

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly audit: AuditService,
  ) {}

  /**
   * The only number a withdrawal can be paid to: the account's registered
   * phone, and only once staff have verified it. Read from the database.
   */
  async payoutAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerifiedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const phone = normalizeBdPhone(user.phone);
    return {
      phone,
      hasValidPhone: phone !== null,
      verified: phone !== null && user.phoneVerifiedAt !== null,
      verifiedAt: user.phoneVerifiedAt ? user.phoneVerifiedAt.toISOString() : null,
    };
  }

  private async requireVerifiedPayoutPhone(userId: string): Promise<string> {
    const account = await this.payoutAccount(userId);
    if (!account.phone) {
      throw new BadRequestException(
        'Your account does not have a valid registered phone number. Please contact support.',
      );
    }
    if (!account.verified) {
      throw new ForbiddenException(
        'Your registered phone number is not verified yet. Withdrawals are only paid to a verified registered number. Please contact support to verify it.',
      );
    }
    return account.phone;
  }

  async createRequest(
    userId: string,
    dto: CreateWithdrawalDto,
    ip?: string,
    ua?: string,
  ): Promise<WithdrawalView> {
    if (dto.amount < WALLET_CONFIG.withdrawal.min || dto.amount > WALLET_CONFIG.withdrawal.max) {
      throw new BadRequestException(
        `Withdrawal amount must be between ${WALLET_CONFIG.withdrawal.min} and ${WALLET_CONFIG.withdrawal.max} ${WALLET_CONFIG.currency}`,
      );
    }

    // The payout number is never taken from the request. If a client sends
    // one anyway it must be the registered number, otherwise the request is
    // refused outright rather than silently redirected.
    const receivingPhone = await this.requireVerifiedPayoutPhone(userId);
    if (dto.receivingPhone !== undefined && normalizeBdPhone(dto.receivingPhone) !== receivingPhone) {
      throw new BadRequestException(
        'Withdrawals can only be sent to the verified phone number registered on your account.',
      );
    }

    const provider = await this.prisma.paymentProvider.findUnique({
      where: { code: dto.providerCode.toLowerCase() },
    });
    if (!provider || !provider.isActive) {
      throw new BadRequestException('Unknown or inactive payment provider');
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId, currency: WALLET_CONFIG.currency },
        });
        // Lock this wallet row so two simultaneous requests are handled one
        // after the other; the pending check below then cannot be raced.
        await tx.$queryRaw`SELECT id FROM wallets WHERE user_id = ${userId} FOR UPDATE`;

        // One pending withdrawal at a time: avoids double-submits and stacked reservations.
        // Locking read: sees requests committed while we waited for the lock
        // (a plain SELECT would read a stale snapshot).
        const pending = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM withdrawal_requests
          WHERE user_id = ${userId} AND status = 'PENDING' LIMIT 1 FOR UPDATE`;
        if (pending.length > 0) {
          throw new ConflictException(
            'You already have a pending withdrawal request. Please wait for it to be reviewed.',
          );
        }

        const created = await tx.withdrawalRequest.create({
          data: {
            userId,
            providerId: provider.id,
            receivingPhone,
            amount: new Prisma.Decimal(dto.amount),
            currency: WALLET_CONFIG.currency,
          },
          include: { provider: true },
        });

        // Reserve the amount from available -> reserved; throws if insufficient.
        const reserved = await this.wallet.reserve(tx, userId, dto.amount, {
          type: 'WITHDRAWAL',
          id: created.id,
          description: `Withdrawal ${created.id}`,
        });

        return tx.withdrawalRequest.update({
          where: { id: created.id },
          data: { reservationTxId: reserved.ledgerId },
          include: { provider: true },
        });
      });

      await this.audit.log(
        AuditAction.WITHDRAWAL_SUBMITTED,
        userId,
        { withdrawalId: result.id, amount: dto.amount, providerCode: provider.code },
        ip,
        ua,
      );

      return withdrawalView(result);
    } catch (err) {
      if (err instanceof InsufficientBalanceError) {
        throw new BadRequestException('Insufficient available balance for this withdrawal');
      }
      throw err;
    }
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.findMany({
        where: { userId },
        include: { provider: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where: { userId } }),
    ]);
    return {
      data: data.map(withdrawalView),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getForUser(userId: string, id: string): Promise<WithdrawalView> {
    const w = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!w) throw new NotFoundException('Withdrawal not found');
    if (w.userId !== userId) throw new UnauthorizedException();
    return withdrawalView(w);
  }

  // ── Staff ────────────────────────────────────────────

  /**
   * Staff listing. `assignedAgentId` scopes the result to one agent: the agent
   * endpoints always pass the caller's own id, so an agent can never list
   * rows that are not assigned to them.
   */
  async adminList(params: {
    status?: TransactionStatus;
    providerCode?: string;
    search?: string;
    page?: number;
    limit?: number;
    assignedAgentId?: string;
    handledByAgentId?: string;
  }) {
    const { status, providerCode, search } = params;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.WithdrawalRequestWhereInput = {};
    if (status) where.status = status;
    if (providerCode) where.provider = { code: providerCode.toLowerCase() };
    if (params.assignedAgentId) where.assignedAgentId = params.assignedAgentId;
    const and: Prisma.WithdrawalRequestWhereInput[] = [];
    if (params.handledByAgentId) {
      and.push({
        OR: [
          { assignedAgentId: params.handledByAgentId },
          { completedById: params.handledByAgentId },
        ],
      });
    }
    if (search) {
      and.push({
        OR: [
          { id: { equals: search } },
          { receivingPhone: { contains: search } },
          { user: { username: { contains: search } } },
        ],
      });
    }
    if (and.length) where.AND = and;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: STAFF_INCLUDE,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      data: data.map(staffView),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private async staffRow(id: string): Promise<StaffWithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: STAFF_INCLUDE,
    });
    return staffView(row!);
  }

  /** Nobody decides or pays out their own withdrawal, whatever their role. */
  private assertNotOwnRequest(actorId: string, ownerId: string) {
    if (actorId === ownerId) {
      throw new ForbiddenException('You cannot process your own withdrawal request.');
    }
  }

  /**
   * The payout number stored on the request must still be the owner's verified
   * registered number at decision time. If the account's number changed after
   * the request was made, the request has to be rejected and re-submitted.
   */
  private async assertPayoutPhoneStillValid(row: { userId: string; receivingPhone: string }) {
    const account = await this.payoutAccount(row.userId);
    if (!account.verified || account.phone !== normalizeBdPhone(row.receivingPhone)) {
      throw new ConflictException(
        "The payout number on this request is not the user's verified registered number. Reject the request so the reserved funds are released.",
      );
    }
  }

  async adminApprove(
    adminId: string,
    id: string,
    dto: AdminDecisionDto,
    ip?: string,
    ua?: string,
  ): Promise<StaffWithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Withdrawal not found');
    this.assertNotOwnRequest(adminId, row.userId);
    if (row.status !== TransactionStatus.PENDING) {
      throw new ConflictException(`Withdrawal is already ${row.status.toLowerCase()}`);
    }
    await this.assertPayoutPhoneStillValid(row);

    const locked = await this.prisma.withdrawalRequest.updateMany({
      where: { id, status: TransactionStatus.PENDING },
      data: {
        status: TransactionStatus.APPROVED,
        processedById: adminId,
        processedAt: new Date(),
        adminNote: dto.adminNote,
      },
    });
    if (locked.count === 0) {
      throw new ConflictException('Withdrawal was processed by another admin');
    }

    await this.audit.log(
      AuditAction.WITHDRAWAL_APPROVED,
      adminId,
      { withdrawalId: id, userId: row.userId, amount: Number(row.amount) },
      ip,
      ua,
    );

    return this.staffRow(id);
  }

  async adminReject(
    adminId: string,
    id: string,
    dto: AdminDecisionDto,
    ip?: string,
    ua?: string,
  ): Promise<StaffWithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Withdrawal not found');
    this.assertNotOwnRequest(adminId, row.userId);
    if (row.status === TransactionStatus.COMPLETED) {
      throw new ConflictException('Cannot reject a completed withdrawal');
    }
    if (row.status === TransactionStatus.REJECTED) {
      throw new ConflictException('Withdrawal is already rejected');
    }

    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.withdrawalRequest.updateMany({
        where: { id, status: { in: [TransactionStatus.PENDING, TransactionStatus.APPROVED] } },
        data: {
          status: TransactionStatus.REJECTED,
          processedById: adminId,
          processedAt: new Date(),
          adminNote: dto.adminNote,
        },
      });
      if (locked.count === 0) {
        throw new ConflictException('Withdrawal was processed by another admin');
      }
      // Release the reservation back to available balance.
      await this.wallet.releaseReservation(tx, row.userId, Number(row.amount), {
        type: 'WITHDRAWAL',
        id: row.id,
        description: `Rejected withdrawal ${row.id}`,
      });
    });

    await this.audit.log(
      AuditAction.WITHDRAWAL_REJECTED,
      adminId,
      { withdrawalId: id, userId: row.userId, reason: dto.adminNote },
      ip,
      ua,
    );

    return this.staffRow(id);
  }

  /**
   * Mark an approved payout as sent and debit the reserved funds.
   * With `asAgent`, the caller is an Agent: the row must be assigned to them
   * and a payout reference is mandatory. The assignment is part of the
   * compare-and-set, so it cannot be raced by a reassignment.
   */
  async complete(
    actorId: string,
    id: string,
    dto: CompleteWithdrawalDto,
    opts: { asAgent: boolean },
    ip?: string,
    ua?: string,
  ): Promise<StaffWithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    // An agent learns nothing about rows that are not theirs: same 404.
    if (!row || (opts.asAgent && row.assignedAgentId !== actorId)) {
      throw new NotFoundException('Withdrawal not found');
    }
    this.assertNotOwnRequest(actorId, row.userId);
    if (opts.asAgent && !dto.payoutReference?.trim()) {
      throw new BadRequestException('Enter the payout transaction reference.');
    }
    if (row.status === TransactionStatus.COMPLETED) {
      throw new ConflictException('Withdrawal is already completed');
    }
    if (row.status !== TransactionStatus.APPROVED) {
      throw new ConflictException(
        'Only approved withdrawals can be marked completed. Approve the payout first.',
      );
    }
    await this.assertPayoutPhoneStillValid(row);

    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.withdrawalRequest.updateMany({
        where: {
          id,
          status: TransactionStatus.APPROVED,
          ...(opts.asAgent ? { assignedAgentId: actorId } : {}),
        },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          completedById: actorId,
          adminNote: dto.adminNote ?? row.adminNote,
          payoutReference: dto.payoutReference,
        },
      });
      if (locked.count === 0) {
        throw new ConflictException('Withdrawal state changed before completion');
      }
      // Debit the reservation — money has actually left the business.
      await this.wallet.debitReservation(tx, row.userId, Number(row.amount), {
        type: 'WITHDRAWAL',
        id: row.id,
        description: `Completed withdrawal ${row.id}`,
      });
      await tx.userProfile.updateMany({
        where: { userId: row.userId },
        data: { totalWithdrawals: { increment: row.amount } },
      });
    });

    await this.audit.log(
      AuditAction.WITHDRAWAL_COMPLETED,
      actorId,
      {
        withdrawalId: id,
        userId: row.userId,
        amount: Number(row.amount),
        payoutReference: dto.payoutReference,
        asAgent: opts.asAgent,
      },
      ip,
      ua,
    );

    return this.staffRow(id);
  }

  /** Active agents a payout can be handed to. */
  async assignableAgents() {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, username: true, firstName: true, roles: true },
      orderBy: { username: 'asc' },
    });
    return users
      .filter((u) => (parseRoles(u.roles) as string[]).includes(Role.AGENT))
      .map((u) => ({ id: u.id, username: u.username, name: u.firstName }));
  }

  /** Hand an approved payout to an agent (or take it back with agentId = null). */
  async assign(
    actorId: string,
    id: string,
    agentId: string | null,
    ip?: string,
    ua?: string,
  ): Promise<StaffWithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Withdrawal not found');
    if (row.status !== TransactionStatus.APPROVED) {
      throw new ConflictException('Only approved withdrawals awaiting payout can be assigned to an agent.');
    }

    if (agentId) {
      const agent = await this.prisma.user.findUnique({
        where: { id: agentId },
        select: { id: true, roles: true, isActive: true },
      });
      if (!agent || !(parseRoles(agent.roles) as string[]).includes(Role.AGENT)) {
        throw new BadRequestException('The selected account is not an agent.');
      }
      if (!agent.isActive) throw new BadRequestException('The selected agent is deactivated.');
      if (agent.id === row.userId) {
        throw new ForbiddenException('A withdrawal cannot be assigned to the account that requested it.');
      }
    }

    const locked = await this.prisma.withdrawalRequest.updateMany({
      where: { id, status: TransactionStatus.APPROVED },
      data: {
        assignedAgentId: agentId,
        assignedById: agentId ? actorId : null,
        assignedAt: agentId ? new Date() : null,
      },
    });
    if (locked.count === 0) {
      throw new ConflictException('Withdrawal state changed before it could be assigned');
    }

    await this.audit.log(
      AuditAction.WITHDRAWAL_ASSIGNED,
      actorId,
      {
        withdrawalId: id,
        userId: row.userId,
        action: agentId ? 'assigned' : 'unassigned',
        agentId,
        previousAgentId: row.assignedAgentId,
      },
      ip,
      ua,
    );

    return this.staffRow(id);
  }

  /** Agent hands an assigned payout back to the admins without paying it. */
  async agentReturn(agentId: string, id: string, note: string, ip?: string, ua?: string) {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!row || row.assignedAgentId !== agentId) {
      throw new NotFoundException('Withdrawal not found');
    }
    if (row.status !== TransactionStatus.APPROVED) {
      throw new ConflictException(`Withdrawal is already ${row.status.toLowerCase()}`);
    }

    const locked = await this.prisma.withdrawalRequest.updateMany({
      where: { id, status: TransactionStatus.APPROVED, assignedAgentId: agentId },
      data: { assignedAgentId: null, assignedById: null, assignedAt: null },
    });
    if (locked.count === 0) {
      throw new ConflictException('Withdrawal state changed before it could be returned');
    }

    await this.audit.log(
      AuditAction.WITHDRAWAL_ASSIGNED,
      agentId,
      { withdrawalId: id, userId: row.userId, action: 'returned_by_agent', note },
      ip,
      ua,
    );
    return { id, returned: true };
  }

  /** Counts for one agent's dashboard. Scoped to that agent only. */
  async agentSummary(agentId: string) {
    const [awaitingPayout, completed, completedSum, players] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.count({
        where: { assignedAgentId: agentId, status: TransactionStatus.APPROVED },
      }),
      this.prisma.withdrawalRequest.count({
        where: { completedById: agentId, status: TransactionStatus.COMPLETED },
      }),
      this.prisma.withdrawalRequest.aggregate({
        where: { completedById: agentId, status: TransactionStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.user.count({ where: { agentId } }),
    ]);
    return {
      awaitingPayout,
      players,
      completed,
      completedAmount: Number(completedSum._sum.amount ?? 0),
      currency: WALLET_CONFIG.currency,
    };
  }
}
