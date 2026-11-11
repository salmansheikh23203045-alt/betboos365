import {
  Body,
  Controller,
  Get,
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
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '../common/interfaces';
import { DepositsService } from './deposits.service';
import { WithdrawalsService } from './withdrawals.service';
import {
  AdminDecisionDto,
  CompleteWithdrawalDto,
  QueryTransactionsDto,
} from './dto';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminFinanceController {
  constructor(
    private readonly deposits: DepositsService,
    private readonly withdrawals: WithdrawalsService,
  ) {}

  @Get('deposits')
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
  listWithdrawals(@Query() q: QueryTransactionsDto) {
    return this.withdrawals.adminList({
      status: q.status,
      providerCode: q.providerCode,
      search: q.search,
      page: q.page,
      limit: q.limit,
    });
  }

  @Get('summary')
  async summary() {
    const [
      depositsPending,
      depositsApproved,
      depositsRejected,
      withdrawalsPending,
      withdrawalsApproved,
      withdrawalsCompleted,
      withdrawalsRejected,
    ] = await Promise.all([
      this.deposits.adminList({ status: TransactionStatus.PENDING, page: 1, limit: 1 }),
      this.deposits.adminList({ status: TransactionStatus.APPROVED, page: 1, limit: 1 }),
      this.deposits.adminList({ status: TransactionStatus.REJECTED, page: 1, limit: 1 }),
      this.withdrawals.adminList({ status: TransactionStatus.PENDING, page: 1, limit: 1 }),
      this.withdrawals.adminList({ status: TransactionStatus.APPROVED, page: 1, limit: 1 }),
      this.withdrawals.adminList({ status: TransactionStatus.COMPLETED, page: 1, limit: 1 }),
      this.withdrawals.adminList({ status: TransactionStatus.REJECTED, page: 1, limit: 1 }),
    ]);
    return {
      deposits: {
        pending: depositsPending.meta.total,
        approved: depositsApproved.meta.total,
        rejected: depositsRejected.meta.total,
      },
      withdrawals: {
        pending: withdrawalsPending.meta.total,
        approved: withdrawalsApproved.meta.total,
        completed: withdrawalsCompleted.meta.total,
        rejected: withdrawalsRejected.meta.total,
      },
    };
  }

  @Post('deposits/:id/approve')
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
  completeWithdrawal(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: CompleteWithdrawalDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.adminComplete(adminId, id, dto, ip, req.headers['user-agent']);
  }
}
