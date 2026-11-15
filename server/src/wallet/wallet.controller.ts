import {
  Body,
  Controller,
  Get,
  Ip,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, PlayerOnly, Public } from '../common/decorators';
import { WalletService } from './wallet.service';
import { DepositsService } from './deposits.service';
import { WithdrawalsService } from './withdrawals.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDepositDto,
  CreateWithdrawalDto,
  QueryTransactionsDto,
  TxTypeFilter,
} from './dto';
import { WALLET_CONFIG } from './wallet.config';
import { providerView, depositView, withdrawalView } from './shape';
import { TransactionStatus } from '@prisma/client';

// Player wallet. Staff accounts (Admin, Sub Admin, Agent) have no wallet
// features: @PlayerOnly() refuses them on every non-public route here.
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@PlayerOnly()
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly deposits: DepositsService,
    private readonly withdrawals: WithdrawalsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async myWallet(@CurrentUser('id') userId: string) {
    return this.wallet.getBalance(userId);
  }

  /** The one number withdrawals can be paid to, and whether it is verified. */
  @Get('payout-account')
  async payoutAccount(@CurrentUser('id') userId: string) {
    return this.withdrawals.payoutAccount(userId);
  }

  @Public()
  @Get('providers')
  async providers() {
    const rows = await this.prisma.paymentProvider.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(providerView);
  }

  @Public()
  @Get('config')
  async config() {
    return {
      currency: WALLET_CONFIG.currency,
      agentNumber: WALLET_CONFIG.agentNumber,
      deposit: WALLET_CONFIG.deposit,
      withdrawal: WALLET_CONFIG.withdrawal,
    };
  }

  @Post('deposits')
  async createDeposit(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDepositDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.deposits.createRequest(userId, dto, ip, req.headers['user-agent']);
  }

  @Post('withdrawals')
  async createWithdrawal(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWithdrawalDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.createRequest(userId, dto, ip, req.headers['user-agent']);
  }

  @Get('deposits')
  async listDeposits(
    @CurrentUser('id') userId: string,
    @Query() q: QueryTransactionsDto,
  ) {
    return this.deposits.listForUser(userId, q.page, q.limit);
  }

  @Get('withdrawals')
  async listWithdrawals(
    @CurrentUser('id') userId: string,
    @Query() q: QueryTransactionsDto,
  ) {
    return this.withdrawals.listForUser(userId, q.page, q.limit);
  }

  @Get('transactions')
  async listTransactions(
    @CurrentUser('id') userId: string,
    @Query() q: QueryTransactionsDto,
  ) {
    const type = q.type ?? TxTypeFilter.ALL;
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;

    // Unified list — fetch both, merge, filter, sort. For the volumes this
    // app is sized for (one user's own history) this is cheaper than a UNION.
    const [deposits, withdrawals] = await Promise.all([
      type === TxTypeFilter.WITHDRAWAL
        ? Promise.resolve([])
        : this.prisma.depositRequest.findMany({
            where: {
              userId,
              ...(q.status ? { status: q.status as TransactionStatus } : {}),
            },
            include: { provider: true },
            orderBy: { createdAt: 'desc' },
            take: 500,
          }),
      type === TxTypeFilter.DEPOSIT
        ? Promise.resolve([])
        : this.prisma.withdrawalRequest.findMany({
            where: {
              userId,
              ...(q.status ? { status: q.status as TransactionStatus } : {}),
            },
            include: { provider: true },
            orderBy: { createdAt: 'desc' },
            take: 500,
          }),
    ]);

    const combined = [
      ...deposits.map((d) => depositView(d as any)),
      ...withdrawals.map((w) => withdrawalView(w as any)),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = combined.length;
    const start = (page - 1) * limit;
    return {
      data: combined.slice(start, start + limit),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  @Get('transactions/:id')
  async getTransaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    // Try deposit first, then withdrawal; either returns 404 only if neither exists.
    const deposit = await this.prisma.depositRequest.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (deposit && deposit.userId === userId) return depositView(deposit);
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (withdrawal && withdrawal.userId === userId) return withdrawalView(withdrawal);
    throw new NotFoundException('Transaction not found');
  }
}
