import {
  BadRequestException,
  ConflictException,
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

@Injectable()
export class WithdrawalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly audit: AuditService,
  ) {}

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

    const provider = await this.prisma.paymentProvider.findUnique({
      where: { code: dto.providerCode.toLowerCase() },
    });
    if (!provider || !provider.isActive) {
      throw new BadRequestException('Unknown or inactive payment provider');
    }

    // Reject a second pending withdrawal while the first is still pending — avoids
    // UI double-submit and reservation stacking.
    const pending = await this.prisma.withdrawalRequest.findFirst({
      where: { userId, status: TransactionStatus.PENDING },
    });
    if (pending) {
      throw new ConflictException(
        'You already have a pending withdrawal request. Please wait for it to be reviewed.',
      );
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.wallet.upsert({
          where: { userId },
          update: {},
          create: { userId, currency: WALLET_CONFIG.currency },
        });

        const created = await tx.withdrawalRequest.create({
          data: {
            userId,
            providerId: provider.id,
            receivingPhone: dto.receivingPhone,
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

  // ── Admin ────────────────────────────────────────────

  async adminList(params: {
    status?: TransactionStatus;
    providerCode?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, providerCode, search } = params;
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: Prisma.WithdrawalRequestWhereInput = {};
    if (status) where.status = status;
    if (providerCode) where.provider = { code: providerCode.toLowerCase() };
    if (search) {
      where.OR = [
        { id: { equals: search } },
        { receivingPhone: { contains: search } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.findMany({
        where,
        include: { provider: true, user: { select: { id: true, username: true } } },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);

    return {
      data: data.map((w) => ({
        ...withdrawalView(w),
        user: w.user ? { id: w.user.id, username: w.user.username } : null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async adminApprove(
    adminId: string,
    id: string,
    dto: AdminDecisionDto,
    ip?: string,
    ua?: string,
  ): Promise<WithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Withdrawal not found');
    if (row.status !== TransactionStatus.PENDING) {
      throw new ConflictException(`Withdrawal is already ${row.status.toLowerCase()}`);
    }

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

    const updated = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { provider: true },
    });

    await this.audit.log(
      AuditAction.WITHDRAWAL_APPROVED,
      adminId,
      { withdrawalId: id, userId: row.userId, amount: Number(row.amount) },
      ip,
      ua,
    );

    return withdrawalView(updated!);
  }

  async adminReject(
    adminId: string,
    id: string,
    dto: AdminDecisionDto,
    ip?: string,
    ua?: string,
  ): Promise<WithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Withdrawal not found');
    if (row.status === TransactionStatus.COMPLETED) {
      throw new ConflictException('Cannot reject a completed withdrawal');
    }
    if (row.status === TransactionStatus.REJECTED) {
      throw new ConflictException('Withdrawal is already rejected');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
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
      return tx.withdrawalRequest.findUnique({
        where: { id },
        include: { provider: true },
      });
    });

    await this.audit.log(
      AuditAction.WITHDRAWAL_REJECTED,
      adminId,
      { withdrawalId: id, userId: row.userId, reason: dto.adminNote },
      ip,
      ua,
    );

    return withdrawalView(updated!);
  }

  async adminComplete(
    adminId: string,
    id: string,
    dto: CompleteWithdrawalDto,
    ip?: string,
    ua?: string,
  ): Promise<WithdrawalView> {
    const row = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Withdrawal not found');
    if (row.status === TransactionStatus.COMPLETED) {
      throw new ConflictException('Withdrawal is already completed');
    }
    if (row.status !== TransactionStatus.APPROVED) {
      throw new ConflictException(
        'Only approved withdrawals can be marked completed. Approve the payout first.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.withdrawalRequest.updateMany({
        where: { id, status: TransactionStatus.APPROVED },
        data: {
          status: TransactionStatus.COMPLETED,
          completedAt: new Date(),
          adminNote: dto.adminNote,
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
      return tx.withdrawalRequest.findUnique({
        where: { id },
        include: { provider: true },
      });
    });

    await this.audit.log(
      AuditAction.WITHDRAWAL_COMPLETED,
      adminId,
      {
        withdrawalId: id,
        userId: row.userId,
        amount: Number(row.amount),
        payoutReference: dto.payoutReference,
      },
      ip,
      ua,
    );

    return withdrawalView(updated!);
  }
}
