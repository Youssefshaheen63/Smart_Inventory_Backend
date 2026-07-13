import { Injectable } from '@nestjs/common';
import { Sku } from '../entities/sku.entity';
import { CreateSkuDto } from '../dto/create-sku.dto';
import { UpdateSkuDto } from '../dto/update-sku.dto';
import { SkuResponseDto } from '../dto/sku-response.dto';


@Injectable()
export class SkuMapper {

  toEntity(createDto: CreateSkuDto): Sku {
    const entity = new Sku();
    entity.skuCode = createDto.skuCode;
    entity.name = createDto.name;
    entity.description = createDto.description ?? null;
    entity.category = createDto.category ?? null;
    entity.unit = createDto.unit ?? 'pcs';
    entity.cost = createDto.cost;
    entity.price = createDto.price;
    entity.reorderThreshold = createDto.reorderThreshold ?? 0;
    entity.safetyStock = createDto.safetyStock ?? 0;
    return entity;
  }


  toResponse(entity: Sku): SkuResponseDto {
    const dto = new SkuResponseDto();
    dto.id = entity.id;
    dto.skuCode = entity.skuCode;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.category = entity.category ?? null;
    dto.unit = entity.unit;
    dto.cost = entity.cost;
    dto.price = entity.price;
    dto.reorderThreshold = entity.reorderThreshold;
    dto.safetyStock = entity.safetyStock;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }


  toResponseList(entities: Sku[]): SkuResponseDto[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  
  updateEntity(entity: Sku, dto: UpdateSkuDto): Sku {
    if (dto.skuCode !== undefined) {
      entity.skuCode = dto.skuCode;
    }
    if (dto.name !== undefined) {
      entity.name = dto.name;
    }
    if (dto.description !== undefined) {
      entity.description = dto.description ?? null;
    }
    if (dto.category !== undefined) {
      entity.category = dto.category ?? null;
    }
    if (dto.unit !== undefined) {
      entity.unit = dto.unit;
    }
    if (dto.cost !== undefined) {
      entity.cost = dto.cost;
    }
    if (dto.price !== undefined) {
      entity.price = dto.price;
    }
    if (dto.reorderThreshold !== undefined) {
      entity.reorderThreshold = dto.reorderThreshold;
    }
    if (dto.safetyStock !== undefined) {
      entity.safetyStock = dto.safetyStock;
    }
    return entity;
  }
}
