import { Test, TestingModule } from '@nestjs/testing';
import { SkuController } from './sku.controller';
import { SkuService } from './sku.service';

describe('SkuController', () => {
  let controller: SkuController;
  let service: SkuService;

  const mockSkuService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkuController],
      providers: [
        {
          provide: SkuService,
          useValue: mockSkuService,
        },
      ],
    }).compile();

    controller = module.get<SkuController>(SkuController);
    service = module.get<SkuService>(SkuService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
