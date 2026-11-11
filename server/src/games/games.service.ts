import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameQueryDto } from './dto';
import { GameCategory, Prisma } from '@prisma/client';
import { gameCategoryToApi, apiToGameCategory } from '../common/utils/enum-map';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GameQueryDto) {
    const where: Prisma.GameWhereInput = { isActive: true };

    if (query.category) {
      const cat = apiToGameCategory(query.category);
      if (cat) where.category = cat;
    }
    if (query.provider) {
      where.provider = { name: { contains: query.provider, mode: 'insensitive' } };
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.game.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { provider: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.game.count({ where }),
    ]);

    return {
      data: data.map((g) => this.toResponseDto(g)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const game = await this.prisma.game.findFirst({
      where: { id, isActive: true },
      include: { provider: true },
    });
    if (!game) throw new NotFoundException('Game not found');
    return this.toResponseDto(game);
  }

  async findByIdIncludingInactive(id: string) {
    // Admin lookup — returns inactive games too, so admins can toggle them
    // back on. Players still hit findById which filters inactive out.
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!game) throw new NotFoundException('Game not found');
    return this.toResponseDto(game);
  }

  async update(id: string, data: { isActive?: boolean; title?: string; thumbnailUrl?: string }) {
    const existing = await this.prisma.game.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Game not found');
    const game = await this.prisma.game.update({
      where: { id },
      data,
      include: { provider: true },
    });
    return this.toResponseDto(game);
  }

  async getCategories() {
    const results = await this.prisma.game.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return results.map((r) => gameCategoryToApi(r.category)).sort();
  }

  async getProviders() {
    const results = await this.prisma.game.findMany({
      where: { isActive: true },
      select: { provider: { select: { name: true } } },
      distinct: ['providerId'],
    });
    return results.map((r) => r.provider.name).sort();
  }

  async recordLaunch(gameId: string, userId: string) {
    await this.prisma.gameLaunch.create({
      data: { userId, gameId },
    });
  }

  private toResponseDto(g: { id: string; title: string; category: GameCategory; isFree: boolean; thumbnailUrl: string | null; isActive: boolean; provider: { name: string } }) {
    return {
      id: g.id,
      title: g.title,
      provider: g.provider.name,
      category: gameCategoryToApi(g.category),
      isFree: g.isFree,
      thumbnailUrl: g.thumbnailUrl ?? '',
      isActive: g.isActive,
    };
  }
}
