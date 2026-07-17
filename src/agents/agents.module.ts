
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalRequest } from './entities/approval-request.entity';
import { ApprovalQueueService } from './approval-queue.service';
import { ApprovalQueueController } from './approval-queue.controller';
import { ApprovalRequestMapper } from './mappers/approval-request.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalRequest])],
  controllers: [ApprovalQueueController],
  providers: [ApprovalQueueService, ApprovalRequestMapper],
  exports: [ApprovalQueueService],
})
export class AgentsModule {}
