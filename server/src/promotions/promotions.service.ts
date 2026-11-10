import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto';
import { PromotionStatus } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    const where = activeOnly ? { status: PromotionStatus.ACTIVE } : {};
    const promos = await this.prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return promos.map((p) => this.toDto(p));
  }

  async findById(id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return this.toDto(promo);
  }

  async create(dto: CreatePromotionDto) {
    const promo = await this.prisma.promotion.create({
      data: {
        title: dto.title,
        description: dto.description,
        badge: dto.badge,
        ctaLabel: dto.ctaLabel,
        ctaHref: dto.ctaHref,
        status: dto.isActive === false ? PromotionStatus.DRAFT : PromotionStatus.ACTIVE,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        minVipLevel: dto.minVipLevel ?? 0,
      },
    });
    return this.toDto(promo);
  }

  private toDto(p: { id: string; title: string; description: string; badge: string; ctaLabel: string; ctaHref: string; status: PromotionStatus; startDate: Date; endDate: Date; minVipLevel: number }) {
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      badge: p.badge,
      ctaLabel: p.ctaLabel,
      ctaHref: p.ctaHref,
      isActive: p.status === PromotionStatus.ACTIVE,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      minVipLevel: p.minVipLevel,
    };
  }
}
