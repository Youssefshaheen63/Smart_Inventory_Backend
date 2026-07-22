import { Injectable } from '@nestjs/common';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';

@Injectable()
export class CategoryMapper {
  toEntity(dto: CreateCategoryDto, tenantId: string): Category {
    const category = new Category();
    category.tenantId = tenantId;
    category.name = dto.name.trim();
    category.description = dto.description?.trim() ?? null;
    return category;
  }

  toResponse(entity: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  toResponseList(entities: Category[]): CategoryResponseDto[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}
