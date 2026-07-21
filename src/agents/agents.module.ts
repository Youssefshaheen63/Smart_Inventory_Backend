
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRun } from './entities/agent-run.entity';
import { AgentStep } from './entities/agent-step.entity';
import { ApprovalRequest } from './entities/approval-request.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { ApprovalQueueService } from './approval-queue.service';
import { ApprovalQueueController } from './approval-queue.controller';
import { AgentRunService } from './agent-run.service';
import { AgentRunMapper } from './mappers/agent-run.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([AgentRun, AgentStep, ApprovalRequest, PurchaseOrder])],
  controllers: [ApprovalQueueController],
  providers: [ApprovalQueueService, AgentRunService, AgentRunMapper],
  exports: [ApprovalQueueService, AgentRunService],
})
export class AgentsModule {}
