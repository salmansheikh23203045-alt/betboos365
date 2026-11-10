import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction as PrismaAuditAction } from '@prisma/client';

export type AuditLogEntry = {
  id: string;
  action: PrismaAuditAction;
  userId: string;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    action: PrismaAuditAction,
    userId: string,
    metadata: Record<string, unknown> = {},
    ipAddress?: string,
    userAgent?: string,
  ) {
    const entry = await this.prisma.auditLog.create({
      data: {
        action,
        userId,
        metadata: metadata as any,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
    this.logger.log(`AUDIT [${action}] user=${userId} ${JSON.stringify(metadata)}`);
    return entry;
  }

  async findAll(page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUser(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async findByAction(action: PrismaAuditAction) {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { timestamp: 'desc' },
    });
  }
}
