import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Ip,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TransactionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, RequirePermissions, Roles } from '../common/decorators';
import { AuthUser, Permission, Role } from '../common/interfaces';
import { DepositsService } from './deposits.service';
import { AdminLedgerService } from './admin-ledger.service';
import { WithdrawalsService } from './withdrawals.service';
import {
  AdminDecisionDto,
  AssignWithdrawalDto,
  CompleteWithdrawalDto,
  QueryTransactionsDto,
  WalletAdjustDto,
  LedgerQueryDto,
  OverviewQueryDto,
} from './dto';

/**
 * Deposit and withdrawal management for the Admin Dashboard.
 * Open to Admin and Sub Admin accounts (Super Admin passes every role check),
 * and every route additionally names the permission it needs. Agents hold
 * neither role nor any of these permissions.
 */
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUB_ADMIN)
export class AdminFinanceController {
  constructor(
    private readonly deposits: DepositsService,
    private readonly withdrawals: WithdrawalsService,
    private readonly ledgerSvc: AdminLedgerService,
  ) {}

  /** Money totals and a daily series, all computed from approved/completed records. */
  @Get('overview')
  @RequirePermissions(Permission.TRANSACTIONS_VIEW)
  overview(@Query() q: OverviewQueryDto) {
    return this.ledgerSvc.overview(q.days ?? 7);
  }

  /** Every wallet ledger movement across all players. */
  @Get('ledger')
  @RequirePermissions(Permission.TRANSACTIONS_VIEW)
  ledger(@Query() q: LedgerQueryDto) {
    return this.ledgerSvc.ledger(q);
  }

  @Get('users/:id/wallet')
  @RequirePermissions(Permission.TRANSACTIONS_VIEW)
  userWallet(@Param('id', ParseUUIDPipe) id: string) {
    return this.ledgerSvc.userWallet(id);
  }

  @Post('users/:id/wallet/adjust')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.WALLET_ADJUST)
  adjust(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WalletAdjustDto,
    @CurrentUser('id') actorId: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.ledgerSvc.adjust(actorId, id, dto, ip, req.headers['user-agent']);
  }

  @Get('deposits')
  @RequirePermissions(Permission.DEPOSITS_VIEW)
  listDeposits(@Query() q: QueryTransactionsDto) {
    return this.deposits.adminList({
      status: q.status,
      providerCode: q.providerCode,
      search: q.search,
      page: q.page,
      limit: q.limit,
    });
  }

  @Get('withdrawals')
  @RequirePermissions(Permission.WITHDRAWALS_VIEW)
  listWithdrawals(@Query() q: QueryTransactionsDto) {
    return this.withdrawals.adminList({
      status: q.status,
      providerCode: q.providerCode,
      search: q.search,
      page: q.page,
      limit: q.limit,
    });
  }

  /** Counts per status. Each half is only filled in for callers allowed to view it. */
  @Get('summary')
  @RequirePermissions(Permission.DEPOSITS_VIEW, Permission.WITHDRAWALS_VIEW)
  async summary(@CurrentUser() actor: AuthUser) {
    const canDeposits = actor.permissions.includes(Permission.DEPOSITS_VIEW);
    const canWithdrawals = actor.permissions.includes(Permission.WITHDRAWALS_VIEW);
    const count = async (
      list: (p: { status: TransactionStatus; page: number; limit: number }) => Promise<{ meta: { total: number } }>,
      status: TransactionStatus,
    ) => (await list({ status, page: 1, limit: 1 })).meta.total;
    const dep = (s: TransactionStatus) => count((p) => this.deposits.adminList(p), s);
    const wd = (s: TransactionStatus) => count((p) => this.withdrawals.adminList(p), s);

    const [deposits, withdrawals] = await Promise.all([
      canDeposits
        ? Promise.all([
            dep(TransactionStatus.PENDING),
            dep(TransactionStatus.APPROVED),
            dep(TransactionStatus.REJECTED),
          ]).then(([pending, approved, rejected]) => ({ pending, approved, rejected }))
        : null,
      canWithdrawals
        ? Promise.all([
            wd(TransactionStatus.PENDING),
            wd(TransactionStatus.APPROVED),
            wd(TransactionStatus.COMPLETED),
            wd(TransactionStatus.REJECTED),
          ]).then(([pending, approved, completed, rejected]) => ({
            pending,
            approved,
            completed,
            rejected,
          }))
        : null,
    ]);
    return { deposits, withdrawals };
  }

  @Post('deposits/:id/approve')
  @RequirePermissions(Permission.DEPOSITS_REVIEW)
  approveDeposit(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminDecisionDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.deposits.adminApprove(adminId, id, dto, ip, req.headers['user-agent']);
  }

  @Post('deposits/:id/reject')
  @RequirePermissions(Permission.DEPOSITS_REVIEW)
  rejectDeposit(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminDecisionDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.deposits.adminReject(adminId, id, dto, ip, req.headers['user-agent']);
  }

  @Post('withdrawals/:id/approve')
  @RequirePermissions(Permission.WITHDRAWALS_REVIEW)
  approveWithdrawal(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminDecisionDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.adminApprove(adminId, id, dto, ip, req.headers['user-agent']);
  }

  @Post('withdrawals/:id/reject')
  @RequirePermissions(Permission.WITHDRAWALS_REVIEW)
  rejectWithdrawal(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AdminDecisionDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.adminReject(adminId, id, dto, ip, req.headers['user-agent']);
  }

  @Post('withdrawals/:id/complete')
  @RequirePermissions(Permission.WITHDRAWALS_COMPLETE)
  completeWithdrawal(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: CompleteWithdrawalDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.complete(adminId, id, dto, { asAgent: false }, ip, req.headers['user-agent']);
  }

  @Get('agents')
  @RequirePermissions(Permission.WITHDRAWALS_ASSIGN)
  assignableAgents() {
    return this.withdrawals.assignableAgents();
  }

  @Post('withdrawals/:id/assign')
  @RequirePermissions(Permission.WITHDRAWALS_ASSIGN)
  assignWithdrawal(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: AssignWithdrawalDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.assign(adminId, id, dto.agentId, ip, req.headers['user-agent']);
  }
}
