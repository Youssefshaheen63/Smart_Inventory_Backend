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
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { successResponse } from '../utils/response.util';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Roles('tenant_owner')
  @Post()
  async create(
    @Body() createWarehouseDto: CreateWarehouseDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.warehousesService.create(createWarehouseDto, user.tenantId);
    return successResponse(data);
  }

  @Get()
  async findAll(@CurrentUser() user: User) {
    const data = await this.warehousesService.findAll(user.tenantId);
    return successResponse(data);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const data = await this.warehousesService.findOne(id, user.tenantId);
    return successResponse(data);
  }

  @Roles('tenant_owner')
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
    @CurrentUser() user: User,
  ) {
    const data = await this.warehousesService.update(id, updateWarehouseDto, user.tenantId);
    return successResponse(data);
  }

  @Roles('tenant_owner')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.warehousesService.remove(id, user.tenantId);
    return successResponse(null);
  }
}
