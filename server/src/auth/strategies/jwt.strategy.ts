import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser, JwtPayload, Role } from '../../common/interfaces';
import { PrismaService } from '../../prisma/prisma.service';
import { parseRoles } from '../../common/utils/roles';
import { effectivePermissions } from '../../common/permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')!,
    });
  }

  // Roles, permissions and active status are read from the database on every
  // request, so a deactivation, role change or permission change takes effect
  // immediately rather than when the access token expires.
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, email: true, roles: true, permissions: true, isActive: true, mustChangePassword: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }
    const roles = parseRoles(user.roles) as unknown as Role[];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions: effectivePermissions(roles, user.permissions),
      mustChangePassword: user.mustChangePassword,
    };
  }
}
