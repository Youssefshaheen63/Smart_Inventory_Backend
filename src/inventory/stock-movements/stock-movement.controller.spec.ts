import { Test, TestingModule } from '@nestjs/testing';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementService } from './stock-movement.service';
import { MovementReason } from './enums/movement-reason.enum';

describe('StockMovementController', () => {
  let controller: StockMovementController;
  let service: StockMovementService;

  const mockStockMovementService = {
    getHistoryForSku: jest.fn(),
    reconcileBalance: jest.fn(),
    getConsumptionSeries: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockMovementController],
      providers: [
        {
          provide: StockMovementService,
          useValue: mockStockMovementService,
        },
      ],
    }).compile();

    controller = module.get<StockMovementController>(StockMovementController);
    service = module.get<StockMovementService>(StockMovementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHistoryForSku', () => {
    it('should delegate to stockMovementService.getHistoryForSku', async () => {
      const mockResult = [
        {
          id: 'mov-1',
          skuId: 'sku-1',
          reason: MovementReason.MANUAL_ADJUSTMENT,
          quantityChange: 5,
          balanceAfter: 15,
          createdAt: new Date(),
        },
      ] as any;

      mockStockMovementService.getHistoryForSku.mockResolvedValue(mockResult);

      const queryDto = { reason: MovementReason.MANUAL_ADJUSTMENT, limit: 10 };
      const result = await controller.getHistoryForSku('sku-uuid', queryDto);

      expect(mockStockMovementService.getHistoryForSku).toHaveBeenCalledWith(
        'sku-uuid',
        queryDto,
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('reconcileBalance', () => {
    it('should delegate to stockMovementService.reconcileBalance', async () => {
      const mockResult = {
        skuId: 'sku-uuid',
        cached: 10,
        calculated: 10,
        matches: true,
      };

      mockStockMovementService.reconcileBalance.mockResolvedValue(mockResult);

      const result = await controller.reconcileBalance('sku-uuid');

      expect(mockStockMovementService.reconcileBalance).toHaveBeenCalledWith('sku-uuid');
      expect(result).toBe(mockResult);
    });
  });

  describe('getConsumptionSeries', () => {
    it('should delegate to stockMovementService.getConsumptionSeries with default sinceDays', async () => {
      const mockResult = [
        { day: '2026-07-15', netChange: -5 },
        { day: '2026-07-16', netChange: 10 },
      ] as any;

      mockStockMovementService.getConsumptionSeries.mockResolvedValue(mockResult);

      const result = await controller.getConsumptionSeries('sku-uuid', 30);

      expect(mockStockMovementService.getConsumptionSeries).toHaveBeenCalledWith(
        'sku-uuid',
        30,
      );
      expect(result).toBe(mockResult);
    });
  });
});
