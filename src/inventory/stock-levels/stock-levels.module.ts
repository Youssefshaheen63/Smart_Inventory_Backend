import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLevel } from './entities/stock-level.entity';
import { Sku } from '../../sku/entities/sku.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockLevel, Sku, Warehouse])],
})
export class StockLevelsModule {}
