import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto';
import { UserRole } from '@prisma/client';

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
        roles: dto.roles as UserRole[],
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
    await this.findByIdOrFail(id);
    return this.prisma.user.update({
      where: { id },
      data: updates,
    });
  }

  async updatePassword(id: string, newPasswordHash: string) {
    await this.findByIdOrFail(id);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });
  }

  async updateRoles(id: string, roles: UserRole[]) {
    await this.findByIdOrFail(id);
    return this.prisma.user.update({
      where: { id },
      data: { roles },
    });
  }

  async deactivate(id: string) {
    await this.findByIdOrFail(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  toResponseDto(user: { id: string; username: string; firstName: string; lastName: string; email: string | null; phone: string | null; roles: UserRole[]; isActive: boolean; createdAt: Date }) {
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
