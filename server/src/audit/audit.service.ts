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
        ipAddress: ipAddress ? ipAddress.slice(0, 45) : null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
      },
    });
    this.logger.log(`AUDIT [${action}] user=${userId} ${JSON.stringify(metadata)}`);
    return entry;
  }

  /** For audit entries that must never fail the action they describe (e.g. login). */
  async logSafe(
    action: PrismaAuditAction,
    userId: string,
    metadata: Record<string, unknown> = {},
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      await this.log(action, userId, metadata, ipAddress, userAgent);
    } catch (err) {
      this.logger.error(`Audit write failed for ${action}: ${(err as Error).message}`);
    }
  }

  async findAll(page = 1, limit = 50) {
    page = Math.max(1, Math.floor(Number(page)) || 1);
    limit = Math.min(200, Math.max(1, Math.floor(Number(limit)) || 50));
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

  /** Latest entries where this account was the actor. */
  async recentForUser(userId: string, limit = 50) {
    const rows = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: Math.min(200, Math.max(1, limit)),
    });
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      metadata: r.metadata,
      ipAddress: r.ipAddress,
      timestamp: r.timestamp.toISOString(),
    }));
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
