import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkuService } from './sku.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import { SkuResponseDto } from './dto/sku-response.dto';


@Controller('sku')
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Post()
  create(@Body() createSkuDto: CreateSkuDto): Promise<SkuResponseDto> {
    return this.skuService.create(createSkuDto);
  }

  @Get()
  findAll(): Promise<SkuResponseDto[]> {
    return this.skuService.findAll();
  }

  
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SkuResponseDto> {
    return this.skuService.findOne(id);
  }


  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSkuDto: UpdateSkuDto,
  ): Promise<SkuResponseDto> {
    return this.skuService.update(id, updateSkuDto);
  }


  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.skuService.remove(id);
  }
}
