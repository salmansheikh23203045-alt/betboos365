import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType as PrismaNotificationType } from '@prisma/client';

export type NotificationEntity = {
  id: string;
  userId: string;
  type: PrismaNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(userId: string, type: PrismaNotificationType, title: string, message: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, message },
    });

    this.gateway.sendToUser(userId, 'notification', {
      id: notification.id,
      type,
      title,
      message,
      createdAt: notification.createdAt.toISOString(),
    });

    this.logger.log(`Notification sent to ${userId}: ${title}`);
    return notification;
  }

  /**
   * Notify without ever failing the caller. Used after a financial decision
   * has already committed: a notification problem must not turn a successful
   * approval into an error response.
   */
  async notifySafe(userId: string, type: PrismaNotificationType, title: string, message: string) {
    try {
      await this.create(userId, type, title, message);
    } catch (err) {
      this.logger.error(`Notification to ${userId} failed: ${(err as Error).message}`);
    }
  }

  /** Live-only event for connected admins; nothing is persisted. */
  notifyStaff(event: string, payload: Record<string, unknown>) {
    try {
      this.gateway.sendToStaff(event, payload);
    } catch (err) {
      this.logger.error(`Staff event ${event} failed: ${(err as Error).message}`);
    }
  }

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
