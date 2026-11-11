import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuditAction,
  PaymentType,
  Prisma,
  TransactionStatus,
  WalletLedgerType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WalletService } from './wallet.service';
import { CreateDepositDto, AdminDecisionDto } from './dto';
import { WALLET_CONFIG } from './wallet.config';
import { depositView, DepositView } from './shape';

@Injectable()
export class DepositsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly audit: AuditService,
  ) {}

  async createRequest(
    userId: string,
    dto: CreateDepositDto,
    ip?: string,
    ua?: string,
  ): Promise<DepositView> {
    if (dto.amount < WALLET_CONFIG.deposit.min || dto.amount > WALLET_CONFIG.deposit.max) {
      throw new BadRequestException(
        `Deposit amount must be between ${WALLET_CONFIG.deposit.min} and ${WALLET_CONFIG.deposit.max} ${WALLET_CONFIG.currency}`,
      );
    }

    const provider = await this.prisma.paymentProvider.findUnique({
      where: { code: dto.providerCode.toLowerCase() },
    });
    if (!provider || !provider.isActive) {
      throw new BadRequestException('Unknown or inactive payment provider');
    }

    // Idempotency: one deposit per (user, provider, transactionReference). Any
    // duplicate — intentional or accidental — collapses onto the first row.
    const idempotencyKey = `${userId}:${provider.id}:${dto.transactionReference.toUpperCase()}`;

    try {
      const deposit = await this.prisma.depositRequest.create({
        data: {
          userId,
          providerId: provider.id,
          paymentType: dto.paymentType,
          amount: new Prisma.Decimal(dto.amount),
          currency: WALLET_CONFIG.currency,
          agentNumber: WALLET_CONFIG.agentNumber,
          transactionReference: dto.transactionReference,
          idempotencyKey,
        },
        include: { provider: true },
      });

      await this.wallet.getOrCreateWallet(userId);

      await this.audit.log(
        AuditAction.DEPOSIT_SUBMITTED,
        userId,
        {
          depositId: deposit.id,
          providerCode: provider.code,
          amount: dto.amount,
          paymentType: dto.paymentType,
        },
        ip,
        ua,
      );

      return depositView(deposit);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(
          'A deposit with this Transaction ID already exists. Each Transaction ID can only be used once.',
        );
      }
      throw err;
    }
  }

  async listForUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.depositRequest.findMany({
        where: { userId },
        include: { provider: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.depositRequest.count({ where: { userId } }),
    ]);
    return {
      data: data.map(depositView),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getForUser(userId: string, id: string): Promise<DepositView> {
    const deposit = await this.prisma.depositRequest.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.userId !== userId) throw new UnauthorizedException();
    return depositView(deposit);
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

    const where: Prisma.DepositRequestWhereInput = {};
    if (status) where.status = status;
    if (providerCode) where.provider = { code: providerCode.toLowerCase() };
    if (search) {
      where.OR = [
        { id: { equals: search } },
        { transactionReference: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.depositRequest.findMany({
        where,
        include: { provider: true, user: { select: { id: true, username: true } } },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.depositRequest.count({ where }),
    ]);
    return {
      data: data.map((d) => ({
        ...depositView(d),
        user: d.user ? { id: d.user.id, username: d.user.username } : null,
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
  ): Promise<DepositView> {
    const deposit = await this.prisma.depositRequest.findUnique({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== TransactionStatus.PENDING) {
      throw new ConflictException(`Deposit is already ${deposit.status.toLowerCase()}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Lock-via-update: only one approver wins; a second concurrent call hits
      // zero rows updated and the result count/null check below rejects it.
      const locked = await tx.depositRequest.updateMany({
        where: { id, status: TransactionStatus.PENDING },
        data: {
          status: TransactionStatus.APPROVED,
          processedById: adminId,
          processedAt: new Date(),
          adminNote: dto.adminNote,
        },
      });
      if (locked.count === 0) {
        throw new ConflictException('Deposit was processed by another admin');
      }

      // Ensure user wallet exists and credit it atomically.
      await tx.wallet.upsert({
        where: { userId: deposit.userId },
        update: {},
        create: { userId: deposit.userId, currency: WALLET_CONFIG.currency },
      });
      await this.wallet.credit(
        tx,
        deposit.userId,
        deposit.amount,
        WalletLedgerType.DEPOSIT_CREDIT,
        { type: 'DEPOSIT', id: deposit.id, description: `Deposit ${deposit.id}` },
      );

      // Update profile totals (best effort — profile is auto-created with the user).
      await tx.userProfile.updateMany({
        where: { userId: deposit.userId },
        data: { totalDeposits: { increment: deposit.amount } },
      });

      return tx.depositRequest.findUnique({
        where: { id },
        include: { provider: true },
      });
    });

    await this.audit.log(
      AuditAction.DEPOSIT_APPROVED,
      adminId,
      { depositId: id, userId: deposit.userId, amount: Number(deposit.amount) },
      ip,
      ua,
    );

    return depositView(updated!);
  }

  async adminReject(
    adminId: string,
    id: string,
    dto: AdminDecisionDto,
    ip?: string,
    ua?: string,
  ): Promise<DepositView> {
    const deposit = await this.prisma.depositRequest.findUnique({ where: { id } });
    if (!deposit) throw new NotFoundException('Deposit not found');
    if (deposit.status !== TransactionStatus.PENDING) {
      throw new ConflictException(`Deposit is already ${deposit.status.toLowerCase()}`);
    }

    const locked = await this.prisma.depositRequest.updateMany({
      where: { id, status: TransactionStatus.PENDING },
      data: {
        status: TransactionStatus.REJECTED,
        processedById: adminId,
        processedAt: new Date(),
        adminNote: dto.adminNote,
      },
    });
    if (locked.count === 0) {
      throw new ConflictException('Deposit was processed by another admin');
    }

    const updated = await this.prisma.depositRequest.findUnique({
      where: { id },
      include: { provider: true },
    });

    await this.audit.log(
      AuditAction.DEPOSIT_REJECTED,
      adminId,
      { depositId: id, userId: deposit.userId, reason: dto.adminNote },
      ip,
      ua,
    );

    return depositView(updated!);
  }
}
