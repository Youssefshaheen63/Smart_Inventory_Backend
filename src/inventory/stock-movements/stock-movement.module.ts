import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { StockMovementService } from './stock-movement.service';
import { StockMovementController } from './stock-movement.controller';
import { StockMovementMapper } from './mappers/stock-movement.mapper';
import { Sku } from '../../sku/entities/sku.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockMovement, Sku]),
  ],
  controllers: [StockMovementController],
  providers: [StockMovementService, StockMovementMapper],
  exports: [StockMovementService],
})
export class StockMovementModule {}
