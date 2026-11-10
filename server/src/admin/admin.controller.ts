import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators';
import { Role } from '../common/interfaces';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Patch('users/:id/roles')
  async updateUserRoles(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    const user = await this.usersService.updateRoles(id, dto.roles);
    await this.auditService.log(AuditAction.ADMIN_ACTION, id, { action: 'roles_updated', roles: dto.roles });
    return this.usersService.toResponseDto(user);
  }

  @Patch('users/:id/deactivate')
  async deactivateUser(@Param('id') id: string) {
    const user = await this.usersService.deactivate(id);
    await this.auditService.log(AuditAction.ADMIN_ACTION, id, { action: 'user_deactivated' });
    return this.usersService.toResponseDto(user);
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.auditService.findAll();
  }
}
