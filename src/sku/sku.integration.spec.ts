import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import 'multer';
import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';
import { Sku } from './entities/sku.entity';
import { SkuMapper } from './mappers/sku.mapper';

describe('Sku CSV Import Integration Flow', () => {
  let controller: SkuController;
  let service: SkuService;
  let repository: Repository<Sku>;

  const savedEntitiesInDb: Sku[] = [];

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn().mockImplementation(async (entityClass, entities) => {
        const arr = Array.isArray(entities) ? entities : [entities];
        arr.forEach((e, idx) => {
          e.id = `uuid-${savedEntitiesInDb.length + idx + 1}`;
          savedEntitiesInDb.push(e);
        });
        return arr;
      }),
    },
  };

  const mockRepository = {
    find: jest.fn().mockImplementation(async (options) => {
      if (options?.where?.skuCode?._value) {
        const searchedCodes: string[] = options.where.skuCode._value;
        return savedEntitiesInDb.filter((item) =>
          searchedCodes.includes(item.skuCode),
        );
      }
      return [];
    }),
    findOne: jest.fn().mockImplementation(async (options) => {
      if (options?.where?.skuCode) {
        return savedEntitiesInDb.find(
          (item) => item.skuCode === options.where.skuCode,
        ) || null;
      }
      return null;
    }),
    save: jest.fn().mockImplementation(async (entity) => {
      entity.id = `uuid-${savedEntitiesInDb.length + 1}`;
      savedEntitiesInDb.push(entity);
      return entity;
    }),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(mockQueryRunner.manager);
      }),
    },
  };

  beforeEach(async () => {
    savedEntitiesInDb.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkuController],
      providers: [
        SkuService,
        SkuMapper,
        {
          provide: getRepositoryToken(Sku),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<SkuController>(SkuController);
    service = module.get<SkuService>(SkuService);
    repository = module.get<Repository<Sku>>(getRepositoryToken(Sku));
  });

  it('should process full CSV import lifecycle with persistence, validation and error reporting', async () => {
    // Seed DB with existing SKU
    savedEntitiesInDb.push({
      id: 'existing-uuid-1',
      skuCode: 'SKU001',
      name: 'Existing Laptop',
      description: 'Old Laptop',
      category: 'Electronics',
      unit: 'pcs',
      cost: 500,
      price: 800,
      reorderThreshold: 5,
      safetyStock: 10,
      currentQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Sku);

    const csvContent = `skuCode,name,description,category,unit,costPrice,sellingPrice
SKU001,Laptop,Dell Latitude,Electronics,PCS,1000,1300
SKU002,Mouse,Wireless Mouse,Accessories,PCS,20,35
SKU002,Mouse Duplicate,Wireless Mouse,Accessories,PCS,20,35
SKU003,Keyboard,,Peripherals,PCS,bad_cost,50
SKU004,Monitor,27-inch 4K,Displays,PCS,300,450`;

    const mockFile = {
      originalname: 'inventory.csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    } as Express.Multer.File;

    const response = await controller.importCsv(mockFile);

    expect(response.success).toBe(true);
    expect(response.data.totalRows).toBe(5);
    expect(response.data.successful).toBe(2); // SKU002 (first occurrence) and SKU004
    expect(response.data.failed).toBe(3); // SKU001 (already in DB), SKU002 (duplicate in CSV), SKU003 (bad cost)

    const errors = response.data.errors;
    expect(errors).toHaveLength(3);

    // Row 1: SKU001 exists in DB
    expect(errors[0].row).toBe(1);
    expect(errors[0].skuCode).toBe('SKU001');
    expect(errors[0].message).toBe('SKU code "SKU001" already exists');

    // Row 3: SKU002 duplicate in CSV
    expect(errors[1].row).toBe(3);
    expect(errors[1].skuCode).toBe('SKU002');
    expect(errors[1].message).toContain('Duplicate SKU code "SKU002" found in CSV file');

    // Row 4: SKU003 invalid cost numeric value
    expect(errors[2].row).toBe(4);
    expect(errors[2].skuCode).toBe('SKU003');

    // Verify DB state: savedEntitiesInDb should contain original SKU001 + imported SKU002 and SKU004
    expect(savedEntitiesInDb).toHaveLength(3);
    const sku002InDb = savedEntitiesInDb.find((s) => s.skuCode === 'SKU002');
    const sku004InDb = savedEntitiesInDb.find((s) => s.skuCode === 'SKU004');

    expect(sku002InDb).toBeDefined();
    expect(sku002InDb?.name).toBe('Mouse');
    expect(sku002InDb?.cost).toBe(20);
    expect(sku002InDb?.price).toBe(35);

    expect(sku004InDb).toBeDefined();
    expect(sku004InDb?.name).toBe('Monitor');
    expect(sku004InDb?.cost).toBe(300);
    expect(sku004InDb?.price).toBe(450);
  });
});
