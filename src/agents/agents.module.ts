
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalRequest } from './entities/approval-request.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { ApprovalQueueService } from './approval-queue.service';
import { ApprovalQueueController } from './approval-queue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApprovalRequest, PurchaseOrder])],
  controllers: [ApprovalQueueController],
  providers: [ApprovalQueueService],
  exports: [ApprovalQueueService],
})
export class AgentsModule {}
