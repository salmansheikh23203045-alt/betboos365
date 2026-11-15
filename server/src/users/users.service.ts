import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto';
import { UserRole, Prisma } from '@prisma/client';
import { parseRoles } from '../common/utils/roles';
import { normalizeBdPhone, bdPhoneVariants } from '../common/utils/phone';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        username: dto.username.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ? dto.email.toLowerCase() : null,
        phone: dto.phone ?? null,
        passwordHash: dto.passwordHash,
        roles: (dto.roles as UserRole[]) as unknown as Prisma.InputJsonValue,
        profile: {
          create: {
            displayName: `${dto.firstName} ${dto.lastName}`,
          },
        },
      },
      include: { profile: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdOrFail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findAll(page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(id: string, updates: { firstName?: string; lastName?: string; phone?: string }) {
    const current = await this.findByIdOrFail(id);
    const data: Prisma.UserUpdateInput = { ...updates };
    if (updates.phone !== undefined) {
      // Changing the registered number drops its verification: the new number
      // has to be verified again before any withdrawal can be paid to it.
      const next = normalizeBdPhone(updates.phone);
      if (!next) throw new BadRequestException('Enter a valid Bangladeshi mobile number');
      data.phone = next;
      if (normalizeBdPhone(current.phone) !== normalizeBdPhone(next)) {
        if (await this.isPhoneTaken(next, id)) {
          throw new ConflictException('This phone number is already registered to another account');
        }
        data.phoneVerifiedAt = null;
      }
    }
    return this.prisma.user.update({ where: { id }, data });
  }

  /** True when another account already uses this number (any stored spelling). */
  async isPhoneTaken(phone: string, exceptUserId?: string) {
    const canonical = normalizeBdPhone(phone);
    const variants = canonical ? bdPhoneVariants(canonical) : [phone];
    const other = await this.prisma.user.findFirst({
      where: { phone: { in: variants }, ...(exceptUserId ? { id: { not: exceptUserId } } : {}) },
      select: { id: true },
    });
    return other !== null;
  }

  /** Staff confirm (or revoke) that the registered number belongs to the account holder. */
  async setPhoneVerified(id: string, verified: boolean) {
    const user = await this.findByIdOrFail(id);
    if (verified && !normalizeBdPhone(user.phone)) {
      throw new BadRequestException('This account has no valid Bangladeshi phone number to verify');
    }
    return this.prisma.user.update({
      where: { id },
      data: { phoneVerifiedAt: verified ? new Date() : null },
    });
  }

  async updatePassword(id: string, newPasswordHash: string) {
    await this.findByIdOrFail(id);
    await this.prisma.user.update({
      where: { id },
      // A chosen password replaces any temporary one, so the forced-change
      // gate lifts in the same write.
      data: { passwordHash: newPasswordHash, mustChangePassword: false },
    });
  }

  async updateRoles(id: string, roles: UserRole[]) {
    await this.findByIdOrFail(id);
    return this.prisma.user.update({
      where: { id },
      data: { roles: roles as unknown as Prisma.InputJsonValue },
    });
  }

  async activate(id: string) {
    await this.findByIdOrFail(id);
    return this.prisma.user.update({ where: { id }, data: { isActive: true } });
  }

  async deactivate(id: string) {
    await this.findByIdOrFail(id);
    // Deactivation also ends every open session.
    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { isActive: false } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date(Date.now() - 60_000) },
      }),
    ]);
    return user;
  }

  toResponseDto(user: { id: string; username: string; firstName: string; lastName: string; email: string | null; phone: string | null; phoneVerifiedAt?: Date | null; roles: unknown; isActive: boolean; mustChangePassword?: boolean; createdAt: Date }) {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      phoneVerified: Boolean(user.phoneVerifiedAt),
      roles: parseRoles(user.roles),
      isActive: user.isActive,
      mustChangePassword: Boolean(user.mustChangePassword),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
