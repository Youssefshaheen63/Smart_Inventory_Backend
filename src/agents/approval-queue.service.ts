
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRequest } from './entities/approval-request.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';
import { PendingApprovalItemDto } from './dto/pending-approval-item.dto';

@Injectable()
export class ApprovalQueueService {
  constructor(
    @InjectRepository(ApprovalRequest)
    private readonly approvalRepo: Repository<ApprovalRequest>,

    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
  ) {}

  async findPending(): Promise<PendingApprovalItemDto[]> {
    const [approvalRequests, pendingPOs] = await Promise.all([
      this.approvalRepo.find({
        where: { status: 'pending' },
        order: { createdAt: 'DESC' },
      }),
      this.poRepo.find({
        where: { status: 'pending_approval' },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const items: PendingApprovalItemDto[] = [
      ...approvalRequests.map((r) => ({
        id: r.id,
        type: 'agent_request' as const,
        status: r.status,
        description: `${r.agentType} agent step ${r.stepNumber}`,
        createdAt: r.createdAt,
      })),
      ...pendingPOs.map((po) => ({
        id: po.id,
        type: 'purchase_order' as const,
        status: po.status,
        description: `Purchase Order`,
        createdAt: po.createdAt,
      })),
    ];

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items;
  }

  async countPending(): Promise<number> {
    const [approvalCount, poCount] = await Promise.all([
      this.approvalRepo.count({ where: { status: 'pending' } }),
      this.poRepo.count({ where: { status: 'pending_approval' } }),
    ]);

    return approvalCount + poCount;
  }
}
