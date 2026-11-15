import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { BonusService } from './bonus.service';
import { TelegramClient } from './telegram.client';
import {
  AdminBonusController,
  TelegramBonusController,
  TelegramWebhookController,
} from './bonus.controller';

@Module({
  imports: [WalletModule],
  controllers: [TelegramBonusController, TelegramWebhookController, AdminBonusController],
  providers: [BonusService, TelegramClient],
})
export class BonusModule {}
