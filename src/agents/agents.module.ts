import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRun } from './entities/agent-run.entity';
import { AgentStep } from './entities/agent-step.entity';
import { ApprovalRequest } from './entities/approval-request.entity';
import { ApprovalQueueService } from './approval-queue.service';
import { ApprovalQueueController } from './approval-queue.controller';
import { LLMService } from './llm.service';
import { AgentRunService } from './agent-run.service';
import { AgentRunMapper } from './mappers/agent-run.mapper';
import { ApprovalRequestMapper } from './mappers/approval-request.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([AgentRun, AgentStep, ApprovalRequest])],
  controllers: [ApprovalQueueController],
  providers: [LLMService,ApprovalQueueService, AgentRunService, AgentRunMapper, ApprovalRequestMapper],
  exports: [LLMService,ApprovalQueueService, AgentRunService],
})
export class AgentsModule {}
