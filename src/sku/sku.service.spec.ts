import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkuService } from './sku.service';
import { Sku } from './entities/sku.entity';
import { SkuMapper } from './mappers/sku.mapper';

describe('SkuService', () => {
  let service: SkuService;
  let repository: Repository<Sku>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkuService,
        SkuMapper,
        {
          provide: getRepositoryToken(Sku),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SkuService>(SkuService);
    repository = module.get<Repository<Sku>>(getRepositoryToken(Sku));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
