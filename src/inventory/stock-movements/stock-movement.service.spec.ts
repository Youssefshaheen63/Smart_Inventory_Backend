import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockMovementService } from './stock-movement.service';
import { StockMovement } from './entities/stock-movement.entity';
import { Sku } from '../../sku/entities/sku.entity';
import { StockMovementMapper } from './mappers/stock-movement.mapper';
import { MovementReason } from './enums/movement-reason.enum';

describe('StockMovementService', () => {
  let service: StockMovementService;
  let mockDataSource: any;

  // Mock repositories inside the transaction manager
  const mockMovRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => ({ id: 'mock-movement-id', createdAt: new Date(), ...data })),
    save: jest.fn((entity) => Promise.resolve(entity)),
    createQueryBuilder: jest.fn(),
  };

  const mockSkuRepo = {
    findOne: jest.fn(),
    save: jest.fn((entity) => Promise.resolve(entity)),
    existsBy: jest.fn(),
  };

  const mockEntityManager = {
    getRepository: jest.fn((entityClass) => {
      if (entityClass === StockMovement) return mockMovRepo;
      if (entityClass === Sku) return mockSkuRepo;
      return null;
    }),
  };

  beforeEach(async () => {
    // Reset jest mocks
    jest.clearAllMocks();

    mockDataSource = {
      // transaction executes the callback passing the entityManager
      transaction: jest.fn((cb) => cb(mockEntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementService,
        StockMovementMapper,
        {
          provide: getRepositoryToken(StockMovement),
          useValue: mockMovRepo,
        },
        {
          provide: getRepositoryToken(Sku),
          useValue: mockSkuRepo,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<StockMovementService>(StockMovementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMovement', () => {
    const params = {
      skuId: 'sku-uuid',
      reason: MovementReason.PURCHASE_ORDER_RECEIPT,
      quantityChange: 10,
      idempotencyKey: 'idem-key-123',
      performedByUserId: 'user-uuid',
      note: 'PO received',
    };

    it('should return existing movement if idempotency key is already used (idempotent no-op)', async () => {
      const existingMovement = {
        id: 'existing-id',
        skuId: 'sku-uuid',
        reason: MovementReason.PURCHASE_ORDER_RECEIPT,
        quantityChange: 10,
        balanceAfter: 15,
        idempotencyKey: 'idem-key-123',
        createdAt: new Date(),
      };
      mockMovRepo.findOne.mockResolvedValue(existingMovement);

      const result = await service.recordMovement(params);

      expect(mockMovRepo.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: 'idem-key-123' },
      });
      // Should not lock Sku or do updates
      expect(mockSkuRepo.findOne).not.toHaveBeenCalled();
      expect(result.id).toBe('existing-id');
      expect(result.balanceAfter).toBe(15);
    });

    it('should throw NotFoundException if SKU does not exist', async () => {
      mockMovRepo.findOne.mockResolvedValue(null);
      mockSkuRepo.findOne.mockResolvedValue(null);

      await expect(service.recordMovement(params)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockSkuRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'sku-uuid' },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('should throw BadRequestException if new balance would be negative', async () => {
      const mockSku = { id: 'sku-uuid', currentQuantity: 5 };
      mockMovRepo.findOne.mockResolvedValue(null);
      mockSkuRepo.findOne.mockResolvedValue(mockSku);

      // Attempting to subtract 10 when current stock is 5
      const negativeParams = { ...params, quantityChange: -10 };

      await expect(service.recordMovement(negativeParams)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully record movement and update SKU balance', async () => {
      const mockSku = { id: 'sku-uuid', currentQuantity: 5 };
      mockMovRepo.findOne.mockResolvedValue(null);
      mockSkuRepo.findOne.mockResolvedValue(mockSku);

      const result = await service.recordMovement(params);

      // Verify balance calculation
      expect(mockSku.currentQuantity).toBe(15); // 5 + 10
      expect(mockSkuRepo.save).toHaveBeenCalledWith(mockSku);

      // Verify movement creation
      expect(mockMovRepo.create).toHaveBeenCalledWith({
        skuId: 'sku-uuid',
        reason: MovementReason.PURCHASE_ORDER_RECEIPT,
        quantityChange: 10,
        balanceAfter: 15,
        idempotencyKey: 'idem-key-123',
        performedByUserId: 'user-uuid',
        performedByAgent: null,
        referenceType: null,
        referenceId: null,
        note: 'PO received',
      });
      expect(mockMovRepo.save).toHaveBeenCalled();
      expect(result.balanceAfter).toBe(15);
      expect(result.skuId).toBe('sku-uuid');
    });
  });

  describe('getHistoryForSku', () => {
    it('should throw NotFoundException if SKU is not found', async () => {
      mockSkuRepo.existsBy.mockResolvedValue(false);

      await expect(
        service.getHistoryForSku('invalid-sku', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return paginated list of mapped movements filterable by query parameters', async () => {
      mockSkuRepo.existsBy.mockResolvedValue(true);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              id: 'm1',
              skuId: 'sku-uuid',
              reason: MovementReason.SALE,
              quantityChange: -2,
              balanceAfter: 8,
              createdAt: new Date(),
            },
          ],
          1,
        ]),
      };
      mockMovRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getHistoryForSku('sku-uuid', {
        reason: MovementReason.SALE,
        page: 1,
        limit: 10,
      });

      expect(mockMovRepo.createQueryBuilder).toHaveBeenCalledWith('sm');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sm.skuId = :skuId',
        { skuId: 'sku-uuid' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'sm.reason = :reason',
        { reason: MovementReason.SALE },
      );
      expect(result.data.length).toBe(1);
      expect(result.data[0].id).toBe('m1');
      expect(result.total).toBe(1);
    });
  });

  describe('reconcileBalance', () => {
    it('should throw NotFoundException if SKU is not found', async () => {
      mockSkuRepo.findOne.mockResolvedValue(null);

      await expect(service.reconcileBalance('invalid-sku')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return reconciliation result comparing cached and ledger sum', async () => {
      mockSkuRepo.findOne.mockResolvedValue({
        id: 'sku-uuid',
        currentQuantity: 12,
      });

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '12' }),
      };
      mockMovRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.reconcileBalance('sku-uuid');

      expect(result.skuId).toBe('sku-uuid');
      expect(result.cached).toBe(12);
      expect(result.calculated).toBe(12);
      expect(result.matches).toBe(true);
    });
  });

  describe('getConsumptionSeries', () => {
    it('should throw NotFoundException if SKU is not found', async () => {
      mockSkuRepo.existsBy.mockResolvedValue(false);

      await expect(
        service.getConsumptionSeries('invalid-sku', 30),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return daily net quantity rows parsed as integers', async () => {
      mockSkuRepo.existsBy.mockResolvedValue(true);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { day: '2026-07-14', netChange: '-3' },
          { day: '2026-07-15', netChange: '10' },
        ]),
      };
      mockMovRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getConsumptionSeries('sku-uuid', 30);

      expect(mockMovRepo.createQueryBuilder).toHaveBeenCalledWith('sm');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sm.skuId = :skuId',
        { skuId: 'sku-uuid' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "sm.createdAt >= NOW() - (:sinceDays * INTERVAL '1 day')",
        { sinceDays: 30 },
      );
      expect(result).toEqual([
        { day: '2026-07-14', netChange: -3 },
        { day: '2026-07-15', netChange: 10 },
      ]);
    });
  });
});
