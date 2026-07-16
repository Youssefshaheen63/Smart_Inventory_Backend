import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { TransitionDto } from './dto/transition.dto';
import { PurchaseOrderResponseDto } from './dto/purchase-order-response.dto';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Post()
  create(@Body() dto: CreatePurchaseOrderDto): Promise<PurchaseOrderResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<PurchaseOrderResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PurchaseOrderResponseDto> {
    return this.service.findOne(id);
  }

  @Post(':id/transition')
  @HttpCode(HttpStatus.OK)
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionDto,
  ): Promise<PurchaseOrderResponseDto> {
    return this.service.transition(id, dto.status);
  }
}
