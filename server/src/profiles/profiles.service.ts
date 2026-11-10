import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProfile(userId: string, displayName: string) {
    const existing = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (existing) return existing;

    return this.prisma.userProfile.create({
      data: { userId, displayName },
    });
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    await this.findByUserId(userId);
    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.preferredCurrency !== undefined && { preferredCurrency: dto.preferredCurrency }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
      },
    });
  }

  toResponseDto(p: { userId: string; displayName: string | null; avatarUrl: string | null; preferredCurrency: string; language: string; timezone: string; vipLevel: number; totalDeposits: Decimal; totalWithdrawals: Decimal; activeBonuses: number; gamesPlayed: number; createdAt: Date }) {
    return {
      userId: p.userId,
      displayName: p.displayName ?? '',
      avatarUrl: p.avatarUrl ?? '',
      preferredCurrency: p.preferredCurrency,
      language: p.language,
      timezone: p.timezone,
      vipLevel: p.vipLevel,
      totalDeposits: Number(p.totalDeposits),
      totalWithdrawals: Number(p.totalWithdrawals),
      activeBonuses: p.activeBonuses,
      gamesPlayed: p.gamesPlayed,
      createdAt: p.createdAt.toISOString(),
    };
  }
}
