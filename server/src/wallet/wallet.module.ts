import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositsService } from './deposits.service';
import { WithdrawalsService } from './withdrawals.service';
import { WalletController } from './wallet.controller';
import { AdminFinanceController } from './admin-finance.controller';

@Module({
  controllers: [WalletController, AdminFinanceController],
  providers: [WalletService, DepositsService, WithdrawalsService],
  exports: [WalletService],
})
export class WalletModule {}
