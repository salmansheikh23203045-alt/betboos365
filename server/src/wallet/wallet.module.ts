import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { DepositsService } from './deposits.service';
import { WithdrawalsService } from './withdrawals.service';
import { AdminLedgerService } from './admin-ledger.service';
import { AgentPlayersService } from './agent-players.service';
import { WalletController } from './wallet.controller';
import { AdminFinanceController } from './admin-finance.controller';
import { AgentController } from './agent.controller';

@Module({
  controllers: [WalletController, AdminFinanceController, AgentController],
  providers: [WalletService, DepositsService, WithdrawalsService, AdminLedgerService, AgentPlayersService],
  exports: [WalletService, WithdrawalsService, DepositsService, AgentPlayersService],
})
export class WalletModule {}
