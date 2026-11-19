import { Injectable, Logger, InternalServerErrorException, UnauthorizedException, ServiceUnavailableException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

@Injectable()
export class HealthService implements OnModuleInit {
  private readonly logger = new Logger(HealthService.name);
  private cachedBuildId: string | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.loadBuildIdOnce();
  }

  private loadBuildIdOnce() {
    if (this.cachedBuildId) return;

    // Strict deterministic production path for cPanel Passenger deployment:
    // app.js runs at application root ($APP_ROOT), and Next.js builds .next/ at $APP_ROOT/.next/BUILD_ID.
    const productionPath = path.resolve(process.cwd(), '.next', 'BUILD_ID');

    let foundId: string | null = null;
    try {
      if (fs.existsSync(productionPath)) {
        const content = fs.readFileSync(productionPath, 'utf8').trim();
        if (content) {
          foundId = content;
        }
      }
    } catch {
      /* ignore read errors */
    }

    if (!foundId) {
      this.logger.error(`Failed to load Next.js BUILD_ID during initialization from strict path: ${productionPath}`);
      this.cachedBuildId = null;
      return;
    }

    this.cachedBuildId = foundId;
    this.logger.log(`Successfully loaded and cached Next.js BUILD_ID: ${this.cachedBuildId}`);
  }

  async check() {
    try {
      // 1. Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException('Database connection failed');
    }
  }

  async getVersion(secretHeader?: string) {
    const serverSecret = process.env.CPANEL_DEPLOY_SECRET;
    if (!serverSecret || typeof serverSecret !== 'string' || serverSecret.trim() === '') {
      this.logger.error('CPANEL_DEPLOY_SECRET is not configured on the server.');
      throw new InternalServerErrorException('Deployment version endpoint is not configured');
    }

    if (!secretHeader || typeof secretHeader !== 'string') {
      throw new UnauthorizedException('Missing deployment secret header');
    }

    const expectedBuf = Buffer.from(serverSecret, 'utf8');
    const providedBuf = Buffer.from(secretHeader, 'utf8');

    if (expectedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(expectedBuf, providedBuf)) {
      throw new UnauthorizedException('Invalid deployment secret header');
    }

    if (!this.cachedBuildId) {
      this.logger.error('Build ID is unavailable because initialization failed to cache it.');
      throw new InternalServerErrorException('Build ID unavailable');
    }

    return {
      status: 'ok',
      buildId: this.cachedBuildId,
    };
  }
}
