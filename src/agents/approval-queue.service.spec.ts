import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApprovalQueueService } from './approval-queue.service';
import { ApprovalRequest } from './entities/approval-request.entity';
import { ApprovalRequestMapper } from './mappers/approval-request.mapper';

describe('ApprovalQueueService', () => {
  let service: ApprovalQueueService;
  let mockRepo: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRepo = {
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalQueueService,
        ApprovalRequestMapper,
        { provide: getRepositoryToken(ApprovalRequest), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ApprovalQueueService>(ApprovalQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all approval requests ordered by createdAt desc', async () => {
      const mockRequests = [
        { id: '1', status: 'pending', agentType: 'reorder', stepNumber: 1, payload: {}, agentRunId: 'run-1', reasoning: null, reviewedBy: null, reviewedAt: null, createdAt: new Date() },
        { id: '2', status: 'approved', agentType: 'negotiation', stepNumber: 2, payload: {}, agentRunId: 'run-2', reasoning: 'ok', reviewedBy: 'user-1', reviewedAt: new Date(), createdAt: new Date() },
      ];
      mockRepo.find.mockResolvedValue(mockRequests);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('countPending', () => {
    it('should return the number of pending approval requests', async () => {
      mockRepo.count.mockResolvedValue(3);

      const result = await service.countPending();

      expect(mockRepo.count).toHaveBeenCalledWith({
        where: { status: 'pending' },
      });
      expect(result).toBe(3);
    });
  });

  describe('findPending', () => {
    it('should return only pending requests', async () => {
      const mockPending = [
        { id: '1', status: 'pending', agentType: 'reorder', stepNumber: 1, payload: {}, agentRunId: 'run-1', reasoning: null, reviewedBy: null, reviewedAt: null, createdAt: new Date() },
      ];
      mockRepo.find.mockResolvedValue(mockPending);

      const result = await service.findPending();

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });
  });
});
