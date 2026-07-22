import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './stock-movements/entities/stock-movement.entity';
import { StockLevel } from './stock-levels/entities/stock-level.entity';
import { SkuModule } from '../sku/sku.module';
import { StockMovementModule } from './stock-movements/stock-movement.module';
import { StockLevelsModule } from './stock-levels/stock-levels.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement, StockLevel]),
    StockMovementModule,
    StockLevelsModule,
    SkuModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [StockMovementModule, StockLevelsModule],
})
export class InventoryModule {}
