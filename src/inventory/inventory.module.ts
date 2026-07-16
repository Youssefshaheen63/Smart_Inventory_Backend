import { Module } from '@nestjs/common';
import { StockMovementModule } from './stock-movements/stock-movement.module';

/**
 * Top-level inventory module.
 *
 * Aggregates all inventory sub-modules. Import `InventoryModule` into
 * `AppModule` to bring in the full inventory feature set.
 *
 * `StockMovementModule` is re-exported so that any module that imports
 * `InventoryModule` can also inject `StockMovementService` directly.
 */
@Module({
  imports: [StockMovementModule],
  exports: [StockMovementModule],
})
export class InventoryModule {}
