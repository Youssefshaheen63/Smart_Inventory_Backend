import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { StockMovement } from './stock-movements/entities/stock-movement.entity';
import { Sku } from '../sku/entities/sku.entity';
import { SkuMapper } from '../sku/mappers/sku.mapper';
import { RecordMovementDto } from './dto/record-movement.dto';
import { MovementReason } from './stock-movements/enums/movement-reason.enum';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockSkuRepo: any;
  let mockMovRepo: any;
  let skuRow: { id: string; currentQuantity: number };

  beforeEach(async () => {
    jest.clearAllMocks();

    skuRow = { id: 'sku-uuid', currentQuantity: 0 };

    mockSkuRepo = {
      findOne: jest.fn().mockImplementation(({ where: { id } }: { where: { id: string } }) =>
        Promise.resolve(id === 'sku-uuid' ? { ...skuRow, reorderThreshold: 5, skuCode: 'TEST', name: 'Test SKU', unit: 'pcs', cost: 10, price: 15, safetyStock: 2 } : null),
      ),
      increment: jest.fn().mockImplementation(
        (_criteria: any, _column: string, value: number) => {
          skuRow.currentQuantity += value;
          return Promise.resolve({ affected: 1 });
        },
      ),
      createQueryBuilder: jest.fn(),
    };

    mockMovRepo = {
      create: jest.fn((data) => ({
        id: 'mock-movement-id',
        createdAt: new Date(),
        ...data,
      })),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        SkuMapper,
        { provide: getRepositoryToken(StockMovement), useValue: mockMovRepo },
        { provide: getRepositoryToken(Sku), useValue: mockSkuRepo },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMovement', () => {
    it('should throw NotFoundException when SKU does not exist', async () => {
      const dto = new RecordMovementDto();
      dto.quantityChange = 10;
      dto.reason = MovementReason.PURCHASE_ORDER_RECEIPT;

      await expect(service.recordMovement('nonexistent-id', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when movement would cause negative stock', async () => {
      const dto = new RecordMovementDto();
      dto.quantityChange = -5;
      dto.reason = MovementReason.SALE;

      await expect(service.recordMovement('sku-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should record a movement and atomically increment currentQuantity', async () => {
      const dto = new RecordMovementDto();
      dto.quantityChange = 10;
      dto.reason = MovementReason.PURCHASE_ORDER_RECEIPT;
      dto.performedBy = 'user-uuid';
      dto.note = 'PO received';

      const result = await service.recordMovement('sku-uuid', dto);

      expect(mockSkuRepo.increment).toHaveBeenCalledWith(
        { id: 'sku-uuid' },
        'currentQuantity',
        10,
      );
      expect(result.skuId).toBe('sku-uuid');
      expect(result.quantityChange).toBe(10);
      expect(result.balanceAfter).toBe(10);
    });

    it('should keep currentQuantity equal to the sum of all movements', async () => {
      const movements = [
        { quantityChange: 50, reason: MovementReason.PURCHASE_ORDER_RECEIPT },
        { quantityChange: -10, reason: MovementReason.SALE },
        { quantityChange: -5, reason: MovementReason.SALE },
        { quantityChange: 20, reason: MovementReason.CUSTOMER_RETURN },
        { quantityChange: -2, reason: MovementReason.WRITE_OFF },
      ];

      for (const m of movements) {
        const dto = new RecordMovementDto();
        dto.quantityChange = m.quantityChange;
        dto.reason = m.reason;
        await service.recordMovement('sku-uuid', dto);
      }

      const expectedSum = movements.reduce((sum, m) => sum + m.quantityChange, 0);
      expect(skuRow.currentQuantity).toBe(expectedSum);
      expect(mockSkuRepo.increment).toHaveBeenCalledTimes(movements.length);
    });
  });

  describe('findLowStock', () => {
    it('should return SKUs where currentQuantity <= reorderThreshold', async () => {
      const mockSkus = [
        { id: 'sku-1', currentQuantity: 3, reorderThreshold: 5, skuCode: 'LOW-1', name: 'Low SKU 1', unit: 'pcs', cost: 10, price: 15, safetyStock: 2, description: null, category: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        { id: 'sku-2', currentQuantity: 5, reorderThreshold: 5, skuCode: 'AT-THRESHOLD', name: 'At threshold', unit: 'pcs', cost: 10, price: 15, safetyStock: 2, description: null, category: null, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSkus),
      };
      mockSkuRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findLowStock();

      expect(mockSkuRepo.createQueryBuilder).toHaveBeenCalledWith('sku');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sku."currentQuantity" <= sku."reorderThreshold"',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'sku."currentQuantity"',
        'ASC',
      );
      expect(result).toHaveLength(2);
      expect(result[0].currentQuantity).toBe(3);
      expect(result[1].currentQuantity).toBe(5);
    });

    it('should exclude SKUs above the threshold', async () => {
      mockSkuRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findLowStock();

      expect(result).toHaveLength(0);
    });
  });
});
