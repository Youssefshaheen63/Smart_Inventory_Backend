import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './stock-movements/entities/stock-movement.entity';
import { Sku } from '../sku/entities/sku.entity';
import { StockMovementModule } from './stock-movements/stock-movement.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement, Sku]),
    StockMovementModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [StockMovementModule],
})
export class InventoryModule {}
