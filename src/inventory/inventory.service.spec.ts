import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { StockMovement } from './stock-movements/entities/stock-movement.entity';
import { StockLevel } from './stock-levels/entities/stock-level.entity';
import { RecordMovementDto } from './dto/record-movement.dto';
import { MovementReason } from './stock-movements/enums/movement-reason.enum';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockStockLevelRepo: any;
  let mockMovRepo: any;
  let stockLevelRow: { id: string; skuId: string; warehouseId: string; quantity: number; reorderThreshold: number; safetyStock: number };

  beforeEach(async () => {
    jest.clearAllMocks();

    stockLevelRow = { id: 'sl-uuid', skuId: 'sku-uuid', warehouseId: 'wh-uuid', quantity: 0, reorderThreshold: 5, safetyStock: 2 };

    mockStockLevelRepo = {
      findOne: jest.fn().mockImplementation(({ where: { skuId, warehouseId } }) =>
        Promise.resolve(skuId === 'sku-uuid' && warehouseId === 'wh-uuid' ? stockLevelRow : null),
      ),
      save: jest.fn().mockImplementation((entity) => {
        Object.assign(stockLevelRow, entity);
        return Promise.resolve(entity);
      }),
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
        { provide: getRepositoryToken(StockMovement), useValue: mockMovRepo },
        { provide: getRepositoryToken(StockLevel), useValue: mockStockLevelRepo },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMovement', () => {
    it('should throw NotFoundException when StockLevel does not exist', async () => {
      const dto = new RecordMovementDto();
      dto.warehouseId = 'wh-uuid';
      dto.quantityChange = 10;
      dto.reason = MovementReason.PURCHASE_ORDER_RECEIPT;

      await expect(service.recordMovement('nonexistent-sku', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when movement would cause negative stock', async () => {
      stockLevelRow.quantity = 0;
      const dto = new RecordMovementDto();
      dto.warehouseId = 'wh-uuid';
      dto.quantityChange = -5;
      dto.reason = MovementReason.SALE;

      await expect(service.recordMovement('sku-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should record a movement and atomically update StockLevel quantity', async () => {
      stockLevelRow.quantity = 0;
      const dto = new RecordMovementDto();
      dto.warehouseId = 'wh-uuid';
      dto.quantityChange = 10;
      dto.reason = MovementReason.PURCHASE_ORDER_RECEIPT;
      dto.performedBy = 'user-uuid';
      dto.note = 'PO received';

      const result = await service.recordMovement('sku-uuid', dto);

      expect(result.skuId).toBe('sku-uuid');
      expect(result.warehouseId).toBe('wh-uuid');
      expect(result.quantityChange).toBe(10);
      expect(result.balanceAfter).toBe(10);
      expect(stockLevelRow.quantity).toBe(10);
    });
  });

  describe('findLowStock', () => {
    it('should return StockLevels where quantity <= reorderThreshold', async () => {
      const mockLevels = [
        { id: 'sl-1', skuId: 'sku-1', warehouseId: 'wh-1', quantity: 3, reorderThreshold: 5, safetyStock: 2 },
        { id: 'sl-2', skuId: 'sku-2', warehouseId: 'wh-1', quantity: 5, reorderThreshold: 5, safetyStock: 2 },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockLevels),
      };
      mockStockLevelRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findLowStock();

      expect(mockStockLevelRepo.createQueryBuilder).toHaveBeenCalledWith('sl');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'sl."quantity" <= sl."reorderThreshold"',
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'sl."quantity"',
        'ASC',
      );
      expect(result).toHaveLength(2);
      expect(result[0].quantity).toBe(3);
      expect(result[1].quantity).toBe(5);
    });

    it('should return empty when all stock levels are above threshold', async () => {
      mockStockLevelRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findLowStock();

      expect(result).toHaveLength(0);
    });
  });
});
