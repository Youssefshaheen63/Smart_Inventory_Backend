import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkuService } from './sku.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkuResponseDto } from './dto/sku-response.dto';
import { SkuQueryDto } from './dto/sku-query.dto';
import { successResponse, paginatedResponse } from '../utils/response.util';


@Controller('sku')
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Post()
  async create(@Body() createSkuDto: CreateSkuDto) {
    const data = await this.skuService.create(createSkuDto);
    return successResponse(data);
  }

  @Get()
  async findAll(@Query() query: SkuQueryDto) {
    const { data, total } = await this.skuService.findAll(query);
    return paginatedResponse(data, query.page!, query.limit!, total);
  }

  
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.skuService.findOne(id);
    return successResponse(data);
  }


  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSkuDto: UpdateSkuDto,
  ) {
    const data = await this.skuService.update(id, updateSkuDto);
    return successResponse(data);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.skuService.remove(id);
    return successResponse(null);
  }
}
