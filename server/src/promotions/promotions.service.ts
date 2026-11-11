import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto';
import { PromotionStatus, Prisma } from '@prisma/client';

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

  async findAllForAdmin() {
    // Admins see every promotion regardless of status (draft, expired, etc.).
    return this.findAll(false);
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

  async update(id: string, dto: UpdatePromotionDto) {
    // Ensure the row exists first (findUnique with a 404 beats a cryptic
    // Prisma P2025 at update time).
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found');

    const data: Prisma.PromotionUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.badge !== undefined) data.badge = dto.badge;
    if (dto.ctaLabel !== undefined) data.ctaLabel = dto.ctaLabel;
    if (dto.ctaHref !== undefined) data.ctaHref = dto.ctaHref;
    if (dto.isActive !== undefined) {
      data.status = dto.isActive ? PromotionStatus.ACTIVE : PromotionStatus.DRAFT;
    }
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.minVipLevel !== undefined) data.minVipLevel = dto.minVipLevel;

    const promo = await this.prisma.promotion.update({ where: { id }, data });
    return this.toDto(promo);
  }

  async remove(id: string) {
    // userPromotions FK is onDelete: Cascade in the schema, so this is safe.
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found');
    await this.prisma.promotion.delete({ where: { id } });
    return { id };
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
