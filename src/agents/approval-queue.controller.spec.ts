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
    it('should return success response with pending approvals', async () => {
      const mockData = [
        { id: '1', status: 'pending', agentType: 'reorder', stepNumber: 1, payload: {}, agentRunId: 'run-1', reasoning: null, reviewedBy: null, reviewedAt: null, createdAt: new Date() },
      ];
      mockService.findPending.mockResolvedValue(mockData);

      const result = await controller.findAll();

      expect(mockService.findPending).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockData, meta: null });
    });
  });
});
