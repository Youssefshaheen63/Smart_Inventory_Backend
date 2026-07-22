import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryMapper } from './mappers/category.mapper';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly categoryMapper: CategoryMapper,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, tenantId: string): Promise<CategoryResponseDto> {
    const existing = await this.categoryRepository.findOne({
      where: {
        tenantId,
        name: createCategoryDto.name.trim(),
      },
    });
    if (existing) {
      throw new ConflictException(`Category "${createCategoryDto.name}" already exists for this tenant`);
    }

    const category = this.categoryMapper.toEntity(createCategoryDto, tenantId);
    const saved = await this.categoryRepository.save(category);
    return this.categoryMapper.toResponse(saved);
  }

  async findAll(tenantId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
    return this.categoryMapper.toResponseList(categories);
  }

  async findOne(id: string, tenantId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    return this.categoryMapper.toResponse(category);
  }

  async update(id: string, updateCategoryDto: CreateCategoryDto, tenantId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    if (updateCategoryDto.name && updateCategoryDto.name.trim() !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: {
          tenantId,
          name: updateCategoryDto.name.trim(),
        },
      });
      if (existing) {
        throw new ConflictException(`Category "${updateCategoryDto.name}" already exists for this tenant`);
      }
      category.name = updateCategoryDto.name.trim();
    }

    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description?.trim() ?? null;
    }

    const saved = await this.categoryRepository.save(category);
    return this.categoryMapper.toResponse(saved);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, tenantId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
    await this.categoryRepository.softRemove(category);
  }
}
