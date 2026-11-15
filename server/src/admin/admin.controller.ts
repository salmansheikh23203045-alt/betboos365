import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto, PhoneVerificationDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, CurrentUser, RequirePermissions } from '../common/decorators';
import { Permission, Role } from '../common/interfaces';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { parseRoles } from '../common/utils/roles';

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
  @RequirePermissions(Permission.DASHBOARD_VIEW)
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Patch('users/:id/roles')
  @RequirePermissions(Permission.USERS_MANAGE)
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
    const targetRoles = parseRoles(target.roles) as Role[];
    const targetIsSuper = targetRoles.includes(Role.SUPER_ADMIN);

    if (targetIsSuper && !actorIsSuper) {
      throw new ForbiddenException('Only Super Admin can modify a Super Admin.');
    }
    // Managing Admin accounts belongs to Super Admin: an Admin cannot change
    // another Admin's roles.
    if (targetRoles.includes(Role.ADMIN) && !actorIsSuper) {
      throw new ForbiddenException('Only Super Admin can modify an Admin.');
    }
    if (!actorIsSuper) {
      const grantingAdmin = dto.roles.includes(Role.ADMIN) && !targetRoles.includes(Role.ADMIN);
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
  @RequirePermissions(Permission.USERS_MANAGE)
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
    if ((parseRoles(target.roles) as Role[]).includes(Role.SUPER_ADMIN) && !actor.roles.includes(Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin can deactivate a Super Admin.');
    }
    if ((parseRoles(target.roles) as Role[]).includes(Role.ADMIN) && !actor.roles.includes(Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin can deactivate an Admin.');
    }

    const user = await this.usersService.deactivate(id);
    await this.auditService.log(AuditAction.ADMIN_ACTION, actor.id, {
      action: 'user_deactivated',
      targetUserId: id,
    });
    return this.usersService.toResponseDto(user);
  }

  @Patch('users/:id/activate')
  @RequirePermissions(Permission.USERS_MANAGE)
  async activateUser(
    @Param('id') id: string,
    @CurrentUser() actor: { id: string; roles: Role[] },
  ) {
    const target = await this.usersService.findById(id);
    if (!target) throw new NotFoundException('User not found.');
    const roles = parseRoles(target.roles) as Role[];
    if ((roles.includes(Role.SUPER_ADMIN) || roles.includes(Role.ADMIN)) && !actor.roles.includes(Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Only Super Admin can reactivate an Admin account.');
    }
    const user = await this.usersService.activate(id);
    await this.auditService.log(AuditAction.ADMIN_ACTION, actor.id, {
      action: 'user_activated',
      targetUserId: id,
    });
    return this.usersService.toResponseDto(user);
  }

  /**
   * Staff confirm that a player's registered phone number is theirs. Until
   * this is done the player cannot withdraw. Setting `verified: false` revokes it.
   */
  @Post('users/:id/phone-verification')
  @RequirePermissions(Permission.USERS_MANAGE)
  async setPhoneVerification(
    @Param('id') id: string,
    @Body() dto: PhoneVerificationDto,
    @CurrentUser() actor: { id: string },
  ) {
    if (actor.id === id) {
      throw new ForbiddenException('You cannot verify your own phone number.');
    }
    const user = await this.usersService.setPhoneVerified(id, dto.verified);
    await this.auditService.log(AuditAction.PHONE_VERIFIED, actor.id, {
      targetUserId: id,
      phone: user.phone,
      verified: dto.verified,
    });
    return this.usersService.toResponseDto(user);
  }

  @Get('audit-logs')
  @RequirePermissions(Permission.AUDIT_VIEW)
  getAuditLogs() {
    return this.auditService.findAll();
  }
}
