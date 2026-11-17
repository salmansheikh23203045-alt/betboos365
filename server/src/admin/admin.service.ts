import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PromotionStatus, TicketStatus } from '@prisma/client';
import { normalizeBdPhone } from '../common/utils/phone';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async getDashboardStats() {
    const oneDayAgo = new Date(Date.now() - 86400000);

    const [totalUsers, activeUsers, totalGames, activePromotions, openTickets, recentRegistrations] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.game.count({ where: { isActive: true } }),
        this.prisma.promotion.count({ where: { status: PromotionStatus.ACTIVE } }),
        this.prisma.supportTicket.count({
          where: { status: { in: [TicketStatus.open, TicketStatus.in_progress] } },
        }),
        this.prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      ]);

    return {
      totalUsers,
      activeUsers,
      totalGames,
      activePromotions,
      openTickets,
      connectedClients: this.notificationsGateway.getConnectedCount(),
      recentRegistrations,
    };
  }

  async getDepositNumbers() {
    const [depSetting, agentSetting] = await Promise.all([
      this.prisma.systemSetting.findUnique({ where: { key: 'DEPOSIT_NUMBER' } }),
      this.prisma.systemSetting.findUnique({ where: { key: 'AGENT_SEND_MONEY_CASHOUT_NUMBER' } }),
    ]);
    const defaultNumber = process.env.DEPOSIT_AGENT_NUMBER ?? '01956869852';
    return {
      depositNumber: depSetting?.value ?? defaultNumber,
      agentSendMoneyCashoutNumber: agentSetting?.value ?? defaultNumber,
    };
  }

  async updateDepositNumbers(
    actorId: string,
    dto: { depositNumber?: string; agentSendMoneyCashoutNumber?: string },
  ) {
    if (dto.depositNumber !== undefined) {
      const norm = normalizeBdPhone(dto.depositNumber);
      if (!norm) {
        throw new BadRequestException('Invalid deposit phone number format.');
      }
      await this.prisma.systemSetting.upsert({
        where: { key: 'DEPOSIT_NUMBER' },
        update: { value: norm },
        create: { key: 'DEPOSIT_NUMBER', value: norm },
      });
    }

    if (dto.agentSendMoneyCashoutNumber !== undefined) {
      const norm = normalizeBdPhone(dto.agentSendMoneyCashoutNumber);
      if (!norm) {
        throw new BadRequestException('Invalid agent send money / cashout phone number format.');
      }
      await this.prisma.systemSetting.upsert({
        where: { key: 'AGENT_SEND_MONEY_CASHOUT_NUMBER' },
        update: { value: norm },
        create: { key: 'AGENT_SEND_MONEY_CASHOUT_NUMBER', value: norm },
      });
    }

    return this.getDepositNumbers();
  }
}
