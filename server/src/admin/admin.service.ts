import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PromotionStatus, TicketStatus } from '@prisma/client';

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
}
