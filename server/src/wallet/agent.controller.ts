import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, RequirePermissions, Roles } from '../common/decorators';
import { Permission, Role } from '../common/interfaces';
import { AuditService } from '../audit/audit.service';
import { WithdrawalsService } from './withdrawals.service';
import { AgentPlayersService } from './agent-players.service';
import { WalletService } from './wallet.service';
import { UserThrottlerGuard } from '../common/guards/user-throttler.guard';
import { Throttle } from '@nestjs/throttler';
import {
  AgentPlayersQueryDto,
  AgentReportQueryDto,
  CompleteWithdrawalDto,
  CreateWithdrawalDto,
  QueryTransactionsDto,
  ReturnWithdrawalDto,
} from './dto';

/**
 * Agent Dashboard API. Agents pay out the withdrawals an admin has assigned
 * to them and nothing else: every query and every write is scoped to
 * `assignedAgentId = caller`. The only player data reachable is the agent's
 * own players (users.agent_id = caller), read-only with masked phone numbers.
 * There is no wallet, settings or other-agent route here, and the agent
 * permission opens no route anywhere else.
 */
@Controller('agent')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.AGENT)
@RequirePermissions(Permission.AGENT_WITHDRAWALS_PROCESS)
export class AgentController {
  constructor(
    private readonly withdrawals: WithdrawalsService,
    private readonly audit: AuditService,
    private readonly players: AgentPlayersService,
    private readonly wallet: WalletService,
  ) {}

  // ── The agent's own wallet ─────────────────────────────────
  // Funded only by audited admin adjustments. Withdrawals follow exactly the
  // player rules (same service): paid only to the agent's own verified
  // registered number, limits, one pending at a time, balance reserved, and
  // an admin approves it. Nobody can approve, pay or be assigned their own.

  @Get('wallet')
  async myWallet(@CurrentUser('id') agentId: string) {
    const [wallet, payout] = await Promise.all([
      this.wallet.getBalance(agentId),
      this.withdrawals.payoutAccount(agentId),
    ]);
    return { wallet, payout };
  }

  @Get('wallet/withdrawals')
  myWithdrawals(@CurrentUser('id') agentId: string, @Query() q: QueryTransactionsDto) {
    return this.withdrawals.listForUser(agentId, q.page ?? 1, q.limit ?? 20);
  }

  @Post('wallet/withdrawals')
  @UseGuards(UserThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  requestWithdrawal(
    @CurrentUser('id') agentId: string,
    @Body() dto: CreateWithdrawalDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.createRequest(agentId, dto, ip, req.headers['user-agent']);
  }

  @Get('players')
  myPlayers(@CurrentUser('id') agentId: string, @Query() q: AgentPlayersQueryDto) {
    return this.players.listForAgent(agentId, q);
  }

  @Get('players/:id')
  myPlayer(@CurrentUser('id') agentId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.players.playerForAgent(agentId, id);
  }

  @Get('report')
  report(@CurrentUser('id') agentId: string, @Query() q: AgentReportQueryDto) {
    return this.players.reportForAgent(agentId, q.days ?? 30);
  }

  @Get('summary')
  summary(@CurrentUser('id') agentId: string) {
    return this.withdrawals.agentSummary(agentId);
  }

  @Get('withdrawals')
  list(@CurrentUser('id') agentId: string, @Query() q: QueryTransactionsDto) {
    return this.withdrawals.adminList({
      status: q.status,
      search: q.search,
      page: q.page,
      limit: q.limit,
      assignedAgentId: agentId,
    });
  }

  @Post('withdrawals/:id/complete')
  complete(
    @CurrentUser('id') agentId: string,
    @Param('id') id: string,
    @Body() dto: CompleteWithdrawalDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.complete(agentId, id, dto, { asAgent: true }, ip, req.headers['user-agent']);
  }

  @Post('withdrawals/:id/return')
  giveBack(
    @CurrentUser('id') agentId: string,
    @Param('id') id: string,
    @Body() dto: ReturnWithdrawalDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    return this.withdrawals.agentReturn(agentId, id, dto.note, ip, req.headers['user-agent']);
  }

  @Get('activity')
  activity(@CurrentUser('id') agentId: string) {
    return this.audit.recentForUser(agentId, 50);
  }
}
