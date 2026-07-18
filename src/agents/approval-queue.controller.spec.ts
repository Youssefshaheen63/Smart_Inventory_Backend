import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalQueueController } from './approval-queue.controller';
import { ApprovalQueueService } from './approval-queue.service';

describe('ApprovalQueueController', () => {
  let controller: ApprovalQueueController;
  let service: ApprovalQueueService;

  const mockService = {
    findPending: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalQueueController],
      providers: [
        { provide: ApprovalQueueService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ApprovalQueueController>(ApprovalQueueController);
    service = module.get<ApprovalQueueService>(ApprovalQueueService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return success response with combined pending items', async () => {
      const mockData = [
        { id: 'ar-1', type: 'agent_request', status: 'pending', description: 'reorder agent step 2', createdAt: new Date() },
        { id: 'po-1', type: 'purchase_order', status: 'pending_approval', description: 'Purchase Order', createdAt: new Date() },
      ];
      mockService.findPending.mockResolvedValue(mockData);

      const result = await controller.findAll();

      expect(mockService.findPending).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockData, meta: null });
    });
  });
});
