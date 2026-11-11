import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser } from '../common/decorators';
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
  async updateUserRoles(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: { id: string; roles: Role[] },
  ) {
    // Privilege-escalation guard. Four rules, in order of specificity:
    //   1. No self-modification. Admins must not change their own role.
    //   2. Only Super Admin may grant SUPER_ADMIN.
    //   3. Only Super Admin may modify a user that already holds
    //      SUPER_ADMIN (so a plain admin can't demote a super admin).
    //   4. Only Super Admin may grant ADMIN (so an admin can't clone itself
    //      into new admin accounts; promote CLI is the governed path).
    const isSelf = actor.id === id;
    if (isSelf) {
      throw new ForbiddenException('You cannot modify your own roles.');
    }

    const actorIsSuper = actor.roles.includes(Role.SUPER_ADMIN);

    const target = await this.usersService.findById(id);
    if (!target) {
      throw new NotFoundException('User not found.');
    }
    const targetIsSuper = target.roles.includes(Role.SUPER_ADMIN);

    if (targetIsSuper && !actorIsSuper) {
      throw new ForbiddenException('Only Super Admin can modify a Super Admin.');
    }
    if (!actorIsSuper) {
      const grantingAdmin = dto.roles.includes(Role.ADMIN) && !target.roles.includes(Role.ADMIN);
      const grantingSuper = dto.roles.includes(Role.SUPER_ADMIN);
      if (grantingSuper) {
        throw new ForbiddenException('Only Super Admin can grant Super Admin.');
      }
      if (grantingAdmin) {
        throw new ForbiddenException('Only Super Admin can grant Admin.');
      }
    }
    if (dto.roles.length === 0) {
      throw new BadRequestException('A user must have at least one role.');
    }

    const user = await this.usersService.updateRoles(id, dto.roles);
    await this.auditService.log(AuditAction.ADMIN_ACTION, actor.id, {
      action: 'roles_updated',
      targetUserId: id,
      roles: dto.roles,
    });
    return this.usersService.toResponseDto(user);
  }

  @Patch('users/:id/deactivate')
  async deactivateUser(
    @Param('id') id: string,
    @CurrentUser() actor: { id: string; roles: Role[] },
  ) {
    if (actor.id === id) {
      throw new ForbiddenException('You cannot deactivate yourself.');
    }
    const target = await this.usersService.findById(id);
    if (!target) {
      throw new NotFoundException('User not found.');
    }
    if (target.roles.includes(Role.SUPER_ADMIN) && !actor.roles.includes(Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin can deactivate a Super Admin.');
    }

    const user = await this.usersService.deactivate(id);
    await this.auditService.log(AuditAction.ADMIN_ACTION, actor.id, {
      action: 'user_deactivated',
      targetUserId: id,
    });
    return this.usersService.toResponseDto(user);
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.auditService.findAll();
  }
}
