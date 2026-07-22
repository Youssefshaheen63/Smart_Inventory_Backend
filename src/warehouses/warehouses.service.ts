import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseResponseDto } from './dto/warehouse-response.dto';
import { WarehouseMapper } from './mappers/warehouse.mapper';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly warehouseMapper: WarehouseMapper,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto, tenantId: string): Promise<WarehouseResponseDto> {
    // If setting as main, ensure no other main warehouse exists for this tenant
    if (createWarehouseDto.isMain) {
      const mainExists = await this.warehouseRepository.existsBy({
        tenantId,
        isMain: true,
      });
      if (mainExists) {
        throw new ConflictException('A main warehouse already exists for this tenant');
      }
    }

    const warehouse = this.warehouseMapper.toEntity(createWarehouseDto, tenantId);
    const saved = await this.warehouseRepository.save(warehouse);
    return this.warehouseMapper.toResponse(saved);
  }

  async findAll(tenantId: string): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.warehouseRepository.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
    return this.warehouseMapper.toResponseList(warehouses);
  }

  async findOne(id: string, tenantId: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID "${id}" not found`);
    }
    return this.warehouseMapper.toResponse(warehouse);
  }

  async update(id: string, updateWarehouseDto: UpdateWarehouseDto, tenantId: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID "${id}" not found`);
    }

    if (updateWarehouseDto.isMain && !warehouse.isMain) {
      const mainExists = await this.warehouseRepository.existsBy({
        tenantId,
        isMain: true,
      });
      if (mainExists) {
        throw new ConflictException('A main warehouse already exists for this tenant');
      }
    }

    if (updateWarehouseDto.name !== undefined) {
      warehouse.name = updateWarehouseDto.name.trim();
    }
    if (updateWarehouseDto.address !== undefined) {
      warehouse.address = updateWarehouseDto.address?.trim() ?? null;
    }
    if (updateWarehouseDto.isMain !== undefined) {
      warehouse.isMain = updateWarehouseDto.isMain;
    }
    if (updateWarehouseDto.isActive !== undefined) {
      warehouse.isActive = updateWarehouseDto.isActive;
    }

    const saved = await this.warehouseRepository.save(warehouse);
    return this.warehouseMapper.toResponse(saved);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID "${id}" not found`);
    }
    await this.warehouseRepository.softRemove(warehouse);
  }
}
