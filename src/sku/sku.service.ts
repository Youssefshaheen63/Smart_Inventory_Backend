import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sku } from './entities/sku.entity';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkuResponseDto } from './dto/sku-response.dto';
import { SkuMapper } from './mappers/sku.mapper';


@Injectable()
export class SkuService {
  constructor(
    @InjectRepository(Sku)
    private readonly skuRepository: Repository<Sku>,
    private readonly skuMapper: SkuMapper,
  ) {}


  async create(createSkuDto: CreateSkuDto): Promise<SkuResponseDto> {
    const skuEntity = this.skuMapper.toEntity(createSkuDto);
    const savedEntity = await this.skuRepository.save(skuEntity);
    return this.skuMapper.toResponse(savedEntity);
  }


  async findAll(): Promise<SkuResponseDto[]> {
    const skuEntities = await this.skuRepository.find();
    return this.skuMapper.toResponseList(skuEntities);
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
