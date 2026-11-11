import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { GamesModule } from './games/games.module';
import { SportsModule } from './sports/sports.module';
import { PromotionsModule } from './promotions/promotions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { PrismaModule } from './prisma/prisma.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
      },
    ]),
    PrismaModule,
    AuditModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    GamesModule,
    SportsModule,
    PromotionsModule,
    SupportModule,
    WalletModule,
    AdminModule,
  ],
})
export class AppModule {}
