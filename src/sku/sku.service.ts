import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sku } from './entities/sku.entity';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkuResponseDto } from './dto/sku-response.dto';
import { SkuMapper } from './mappers/sku.mapper';
import { SkuQueryDto } from './dto/sku-query.dto';
import { paginate } from '../utils/pagination.util';
import { applySortAndSearch } from '../utils/query.util';


@Injectable()
export class SkuService {
  constructor(
    @InjectRepository(Sku)
    private readonly skuRepository: Repository<Sku>,
    private readonly skuMapper: SkuMapper,
  ) {}


  async create(createSkuDto: CreateSkuDto): Promise<SkuResponseDto> {
    const existing = await this.skuRepository.findOne({
      where: { skuCode: createSkuDto.skuCode },
    });
    if (existing) {
      throw new ConflictException(
        `SKU code "${createSkuDto.skuCode}" already exists`,
      );
    }
    const skuEntity = this.skuMapper.toEntity(createSkuDto);
    const savedEntity = await this.skuRepository.save(skuEntity);
    return this.skuMapper.toResponse(savedEntity);
  }


  async findAll(query: SkuQueryDto): Promise<{ data: SkuResponseDto[]; total: number }> {
    const qb = this.skuRepository.createQueryBuilder('sku');
    applySortAndSearch(qb, 'sku', query.sortBy, query.sortOrder, query.search, ['name', 'skuCode']);
    const result = await paginate(qb, query.page!, query.limit!);
    return { data: this.skuMapper.toResponseList(result.data), total: result.total };
  }


  async findOne(id: string): Promise<SkuResponseDto> {
    const skuEntity = await this.skuRepository.findOne({ where: { id } });
    if (!skuEntity) {
      throw new NotFoundException(`SKU with ID "${id}" not found`);
    }
    return this.skuMapper.toResponse(skuEntity);
  }


  async update(id: string, updateSkuDto: UpdateSkuDto): Promise<SkuResponseDto> {
    const skuEntity = await this.skuRepository.findOne({ where: { id } });
    if (!skuEntity) {
      throw new NotFoundException(`SKU with ID "${id}" not found`);
    }

    if (updateSkuDto.skuCode && updateSkuDto.skuCode !== skuEntity.skuCode) {
      const existing = await this.skuRepository.findOne({
        where: { skuCode: updateSkuDto.skuCode },
      });
      if (existing) {
        throw new ConflictException(
          `SKU code "${updateSkuDto.skuCode}" already exists`,
        );
      }
    }

    const updatedEntity = this.skuMapper.updateEntity(skuEntity, updateSkuDto);
    const savedEntity = await this.skuRepository.save(updatedEntity);
    return this.skuMapper.toResponse(savedEntity);
  }

  async remove(id: string): Promise<void> {
    const skuEntity = await this.skuRepository.findOne({ where: { id } });
    if (!skuEntity) {
      throw new NotFoundException(`SKU with ID "${id}" not found`);
    }
    await this.skuRepository.softRemove(skuEntity);
  }
}
