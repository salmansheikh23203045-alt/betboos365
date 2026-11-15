import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditAction, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto';
import { Role, JwtPayload } from '../common/interfaces';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { parseRoles } from '../common/utils/roles';
import { normalizeBdPhone } from '../common/utils/phone';

// A refresh token that was rotated this recently is still honoured. Browsers
// fire several requests at once when the access token expires; without the
// window, all but the first would fail and log the user out.
const ROTATION_GRACE_MS = 15_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto, ip?: string, ua?: string) {
    if (!dto.acceptTerms) {
      throw new BadRequestException('You must accept the terms and conditions');
    }

    const existingByUsername = await this.usersService.findByUsername(dto.username);
    if (existingByUsername) {
      throw new ConflictException('This username is already taken');
    }

    if (dto.email) {
      const existingByEmail = await this.usersService.findByEmail(dto.email);
      if (existingByEmail) {
        throw new ConflictException('An account with this email already exists');
      }
    }

    const phone = normalizeBdPhone(dto.phone);
    if (!phone) {
      throw new BadRequestException('Enter a valid Bangladeshi mobile number');
    }
    if (await this.usersService.isPhoneTaken(phone)) {
      throw new ConflictException('This phone number is already registered');
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    let user;
    try {
      user = await this.usersService.create({
        username: dto.username.toLowerCase(),
        firstName: dto.firstName || dto.username.slice(0, 30),
        lastName: dto.lastName || 'Player',
        email: dto.email ? dto.email.toLowerCase() : undefined,
        phone,
        passwordHash: hashedPassword,
        roles: [Role.USER],
      });
    } catch (err) {
      // Two sign-ups racing for the same username/email: the unique index wins.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('This username or email is already registered');
      }
      throw err;
    }

    this.logger.log(`User registered: ${user.id}`);
    await this.audit.logSafe(AuditAction.REGISTER, user.id, {}, ip, ua);
    return this.generateTokens(user);
  }

  async login(dto: LoginDto, ip?: string, ua?: string) {
    const user = await this.usersService.findByUsername(dto.username.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Checked only after the password matches, so the response does not reveal
    // account status to someone guessing usernames.
    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated. Please contact support.');
    }

    this.logger.log(`User logged in: ${user.id}`);
    await this.audit.logSafe(AuditAction.LOGIN, user.id, {}, ip, ua);
    return this.generateTokens(user);
  }

  async refreshAccessToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (stored.revokedAt) {
      const rotatedRecently = Date.now() - stored.revokedAt.getTime() < ROTATION_GRACE_MS;
      if (!rotatedRecently) {
        // A long-revoked token being replayed means it leaked: end every
        // session for this user.
        await this.invalidateUserRefreshTokens(stored.userId);
        this.logger.warn(`Revoked refresh token replayed for user ${stored.userId}; all sessions revoked`);
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    }

    const user = await this.usersService.findById(stored.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return this.generateTokens(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto, ip?: string, ua?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    // Re-using the old (possibly temporary) password would leave it valid.
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new BadRequestException('The new password must be different from the current one');
    }

    const salt = await bcrypt.genSalt(12);
    const newHash = await bcrypt.hash(dto.newPassword, salt);
    await this.usersService.updatePassword(userId, newHash);

    await this.invalidateUserRefreshTokens(userId);
    await this.audit.logSafe(
      AuditAction.PASSWORD_CHANGE,
      userId,
      user.mustChangePassword ? { replacedTemporaryPassword: true } : {},
      ip,
      ua,
    );
    this.logger.log(`Password changed: ${userId}`);
  }

  async logout(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) return;
    await this.prisma.refreshToken.updateMany({
      where: { id: stored.id },
      data: { revokedAt: AuthService.hardRevokedAt() },
    });
    await this.audit.logSafe(AuditAction.LOGOUT, stored.userId);
  }

  /** Revoke every refresh token a user holds (deactivation, password change). */
  async invalidateUserRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: AuthService.hardRevokedAt() },
    });
  }

  // Deliberate revocations are back-dated past the rotation grace window so a
  // logged-out token can never be accepted again.
  private static hardRevokedAt(): Date {
    return new Date(Date.now() - ROTATION_GRACE_MS * 4);
  }

  private async generateTokens(user: {
    id: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    roles: unknown;
    mustChangePassword?: boolean;
  }) {
    const normalizedRoles = parseRoles(user.roles) as Role[];
    const mustChangePassword = Boolean(user.mustChangePassword);
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: normalizedRoles,
      ...(mustChangePassword ? { pwc: true } : {}),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const refreshExpiration = this.configService.get<string>('jwt.refreshExpiration') ?? '7d';
    const days = parseInt(refreshExpiration) || 7;

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: normalizedRoles,
        mustChangePassword,
      },
    };
  }
}
