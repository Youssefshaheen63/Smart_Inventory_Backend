import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { successResponse } from '../utils/response.util';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles('tenant_owner')
  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.categoriesService.create(createCategoryDto, user.tenantId);
    return successResponse(data);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    const data = await this.categoriesService.findAll(user.tenantId);
    return successResponse(data);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const data = await this.categoriesService.findOne(id, user.tenantId);
    return successResponse(data);
  }

  @Roles('tenant_owner')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: CreateCategoryDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.categoriesService.update(id, updateCategoryDto, user.tenantId);
    return successResponse(data);
  }

  @Roles('tenant_owner')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.categoriesService.remove(id, user.tenantId);
    return successResponse(null);
  }
}
