import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../interfaces';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const roles: Role[] = Array.isArray(user?.roles) ? user.roles : [];
    // Super Admin sits above every other role, so it satisfies any requirement.
    if (roles.includes(Role.SUPER_ADMIN)) return true;
    return requiredRoles.some((role) => roles.includes(role));
  }
}
