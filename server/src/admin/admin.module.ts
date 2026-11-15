import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { AgentManagementModule } from './agent-management/agent-management.module';

@Module({
  imports: [UsersModule, AuditModule, AgentManagementModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
