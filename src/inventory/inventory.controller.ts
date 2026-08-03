import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { RecordMovementDto } from './dto/record-movement.dto';
import { successResponse } from '../utils/response.util';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('skus/low-stock')
  async findLowStock() {
    const data = await this.inventoryService.findLowStock();
    return successResponse(data);
  }

  @Post('skus/:id/movements')
  @HttpCode(HttpStatus.CREATED)
  async recordMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordMovementDto,
  ) {
    const data = await this.inventoryService.recordMovement(id, dto);
    return successResponse(data);
  }
}
