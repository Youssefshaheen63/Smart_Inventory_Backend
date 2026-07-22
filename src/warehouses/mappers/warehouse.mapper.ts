import { Injectable } from '@nestjs/common';
import { Warehouse } from '../entities/warehouse.entity';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { WarehouseResponseDto } from '../dto/warehouse-response.dto';

@Injectable()
export class WarehouseMapper {
  toEntity(dto: CreateWarehouseDto, tenantId: string): Warehouse {
    const warehouse = new Warehouse();
    warehouse.tenantId = tenantId;
    warehouse.name = dto.name.trim();
    warehouse.address = dto.address?.trim() ?? null;
    warehouse.isMain = dto.isMain ?? false;
    warehouse.isActive = true;
    return warehouse;
  }

  toResponse(entity: Warehouse): WarehouseResponseDto {
    const dto = new WarehouseResponseDto();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.name = entity.name;
    dto.address = entity.address;
    dto.isMain = entity.isMain;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  toResponseList(entities: Warehouse[]): WarehouseResponseDto[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}
