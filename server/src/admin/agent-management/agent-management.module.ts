import { Module } from '@nestjs/common';
import { StaffManagementService } from './agent-management.service';
import {
  AgentManagementController,
  SubAdminManagementController,
} from './agent-management.controller';
import { WalletModule } from '../../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [AgentManagementController, SubAdminManagementController],
  providers: [StaffManagementService],
})
export class AgentManagementModule {}
