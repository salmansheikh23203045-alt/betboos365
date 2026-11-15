import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../interfaces';
import {
  ALLOW_PENDING_PASSWORD_KEY,
  IS_PUBLIC_KEY,
  PERMISSIONS_KEY,
  PLAYER_ONLY_KEY,
} from '../decorators';
import { isRestrictedStaff } from '../permissions';

/**
 * Runs after JwtAuthGuard and RolesGuard.
 *  - @RequirePermissions(): the caller must hold one of the listed permissions.
 *    There is no role bypass here. Super Admin passes because its permission
 *    set contains the permission, not because of its role name.
 *  - @PlayerOnly(): Admin, Sub Admin and Agent accounts are refused.
 *  - An account still on a temporary password reaches only routes marked
 *    @AllowPendingPasswordChange() (read the session, change the password).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const { user } = context.switchToHttp().getRequest();
    const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];

    if (
      user?.mustChangePassword === true &&
      !this.reflector.getAllAndOverride<boolean>(ALLOW_PENDING_PASSWORD_KEY, targets)
    ) {
      throw new ForbiddenException({
        message: 'You must change your temporary password before continuing.',
        error: 'PasswordChangeRequired',
      });
    }

    if (
      this.reflector.getAllAndOverride<boolean>(PLAYER_ONLY_KEY, targets) &&
      isRestrictedStaff(roles)
    ) {
      throw new ForbiddenException('This feature is not available for staff accounts.');
    }

    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, targets);
    if (!required || required.length === 0) return true;

    const held: string[] = Array.isArray(user?.permissions) ? user.permissions : [];
    if (!required.some((p) => held.includes(p))) {
      throw new ForbiddenException('You do not have permission to perform this action.');
    }
    return true;
  }
}
