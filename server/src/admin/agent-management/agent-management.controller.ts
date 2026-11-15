import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffManagementService } from './agent-management.service';
import {
  CreateStaffDto,
  CreateSubAdminDto,
  ResetStaffPasswordDto,
  SetSubAdminPermissionsDto,
  StaffStatusDto,
  UpdateStaffDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, RequirePermissions, Roles } from '../../common/decorators';
import { Permission, Role } from '../../common/interfaces';
import { SUB_ADMIN_DEFAULT, SUB_ADMIN_GRANTABLE } from '../../common/permissions';
import { WithdrawalsService } from '../../wallet/withdrawals.service';
import { AssignPlayerDto, QueryTransactionsDto } from '../../wallet/dto';
import { AgentPlayersService } from '../../wallet/agent-players.service';

/** Agent Management. Main Admin and Super Admin only. */
@Controller('admin/agents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@RequirePermissions(Permission.AGENTS_MANAGE)
export class AgentManagementController {
  constructor(
    private readonly staff: StaffManagementService,
    private readonly withdrawals: WithdrawalsService,
    private readonly agentPlayers: AgentPlayersService,
  ) {}

  /** Players linked to this agent. */
  @Get(':id/players')
  players(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentPlayers.listForAdmin(id);
  }

  @Post(':id/players')
  assignPlayer(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPlayerDto,
  ) {
    return this.agentPlayers.assign(actorId, id, dto.username);
  }

  @Delete(':id/players/:playerId')
  unassignPlayer(
    @CurrentUser('id') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('playerId', ParseUUIDPipe) playerId: string,
  ) {
    return this.agentPlayers.unassign(actorId, id, playerId);
  }

  @Get()
  list() {
    return this.staff.list(Role.AGENT);
  }

  @Post()
  create(@CurrentUser('id') actorId: string, @Body() dto: CreateStaffDto) {
    return this.staff.create(actorId, Role.AGENT, dto);
  }

  @Patch(':id')
  update(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(actorId, Role.AGENT, id, dto);
  }

  @Patch(':id/status')
  setStatus(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: StaffStatusDto) {
    return this.staff.setStatus(actorId, Role.AGENT, id, dto.isActive);
  }

  @Post(':id/reset-password')
  resetPassword(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: ResetStaffPasswordDto,
  ) {
    return this.staff.resetPassword(actorId, Role.AGENT, id, dto.password);
  }

  @Get(':id/activity')
  activity(@CurrentUser('id') actorId: string, @Param('id') id: string) {
    return this.staff.activity(actorId, Role.AGENT, id);
  }

  /** Withdrawals assigned to, or paid out by, this agent. */
  @Get(':id/withdrawals')
  async handledWithdrawals(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Query() q: QueryTransactionsDto,
  ) {
    await this.staff.activity(actorId, Role.AGENT, id); // proves the target is an agent
    return this.withdrawals.adminList({
      status: q.status,
      page: q.page,
      limit: q.limit,
      handledByAgentId: id,
    });
  }
}

/** Sub Admin Management. Main Admin and Super Admin only; a Sub Admin can never reach it. */
@Controller('admin/sub-admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@RequirePermissions(Permission.SUB_ADMINS_MANAGE)
export class SubAdminManagementController {
  constructor(private readonly staff: StaffManagementService) {}

  @Get()
  async list() {
    const result = await this.staff.list(Role.SUB_ADMIN);
    return { ...result, grantable: SUB_ADMIN_GRANTABLE, defaults: SUB_ADMIN_DEFAULT };
  }

  @Post()
  create(@CurrentUser('id') actorId: string, @Body() dto: CreateSubAdminDto) {
    return this.staff.create(actorId, Role.SUB_ADMIN, dto);
  }

  @Patch(':id')
  update(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.staff.update(actorId, Role.SUB_ADMIN, id, dto);
  }

  @Patch(':id/status')
  setStatus(@CurrentUser('id') actorId: string, @Param('id') id: string, @Body() dto: StaffStatusDto) {
    return this.staff.setStatus(actorId, Role.SUB_ADMIN, id, dto.isActive);
  }

  @Post(':id/reset-password')
  resetPassword(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: ResetStaffPasswordDto,
  ) {
    return this.staff.resetPassword(actorId, Role.SUB_ADMIN, id, dto.password);
  }

  @Put(':id/permissions')
  setPermissions(
    @CurrentUser('id') actorId: string,
    @Param('id') id: string,
    @Body() dto: SetSubAdminPermissionsDto,
  ) {
    return this.staff.setSubAdminPermissions(actorId, id, dto.permissions);
  }

  @Get(':id/activity')
  activity(@CurrentUser('id') actorId: string, @Param('id') id: string) {
    return this.staff.activity(actorId, Role.SUB_ADMIN, id);
  }
}
