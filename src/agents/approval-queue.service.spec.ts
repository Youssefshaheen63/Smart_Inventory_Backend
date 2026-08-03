import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApprovalQueueService } from './approval-queue.service';
import { ApprovalRequest } from './entities/approval-request.entity';
import { PurchaseOrder } from '../purchase-orders/entities/purchase-order.entity';

describe('ApprovalQueueService', () => {
  let service: ApprovalQueueService;
  let mockApprovalRepo: any;
  let mockPoRepo: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockApprovalRepo = {
      find: jest.fn(),
      count: jest.fn(),
    };

    mockPoRepo = {
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalQueueService,
        { provide: getRepositoryToken(ApprovalRequest), useValue: mockApprovalRepo },
        { provide: getRepositoryToken(PurchaseOrder), useValue: mockPoRepo },
      ],
    }).compile();

    service = module.get<ApprovalQueueService>(ApprovalQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPending', () => {
    it('should return combined list sorted by createdAt desc', async () => {
      const now = new Date();
      const later = new Date(now.getTime() + 1000);

      mockApprovalRepo.find.mockResolvedValue([
        { id: 'ar-1', status: 'pending', agentType: 'reorder', stepNumber: 2, createdAt: later },
      ]);
      mockPoRepo.find.mockResolvedValue([
        { id: 'po-1', status: 'pending_approval', createdAt: now },
      ]);

      const result = await service.findPending();

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('agent_request');
      expect(result[0].id).toBe('ar-1');
      expect(result[1].type).toBe('purchase_order');
      expect(result[1].id).toBe('po-1');
    });

    it('should return empty array when nothing is pending', async () => {
      mockApprovalRepo.find.mockResolvedValue([]);
      mockPoRepo.find.mockResolvedValue([]);

      const result = await service.findPending();

      expect(result).toHaveLength(0);
    });
  });

  describe('countPending', () => {
    it('should return sum of pending agent requests and POs', async () => {
      mockApprovalRepo.count.mockResolvedValue(3);
      mockPoRepo.count.mockResolvedValue(2);

      const result = await service.countPending();

      expect(result).toBe(5);
    });
  });
});
