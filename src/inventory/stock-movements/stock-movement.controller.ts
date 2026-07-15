import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  StockMovementService,
  ReconciliationResult,
  DailyConsumptionRow,
} from './stock-movement.service';
import { MovementQueryDto } from './dto/movement-query.dto';
import { StockMovementResponseDto } from './dto/stock-movement-response.dto';

@Controller('inventory/stock-movements')
export class StockMovementController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  /**
   * GET /inventory/stock-movements/sku/:skuId
   *
   * Paginated, filterable history of all stock movements for a single SKU,
   * returned newest-first.
   *
   * Query params: `from`, `to` (ISO-8601 dates), `reason` (MovementReason),
   * `limit` (default 50, max 500).
   */
  @Get('sku/:skuId')
  getHistoryForSku(
    @Param('skuId', ParseUUIDPipe) skuId: string,
    @Query() query: MovementQueryDto,
  ): Promise<StockMovementResponseDto[]> {
    return this.stockMovementService.getHistoryForSku(skuId, query);
  }

  /**
   * GET /inventory/stock-movements/sku/:skuId/reconcile
   *
   * Integrity check: re-sums the ledger and compares it to the cached
   * `sku.currentQuantity`.  Returns `{ cached, calculated, matches }`.
   *
   * Not on the hot path — intended for admin / cron use.
   */
  @Get('sku/:skuId/reconcile')
  reconcileBalance(
    @Param('skuId', ParseUUIDPipe) skuId: string,
  ): Promise<ReconciliationResult> {
    return this.stockMovementService.reconcileBalance(skuId);
  }

  /**
   * GET /inventory/stock-movements/sku/:skuId/consumption?sinceDays=30
   *
   * Returns daily net quantity changes over the last `sinceDays` calendar
   * days (default 30), ordered oldest-first.  Intended as a data feed for
   * the demand-forecasting feature.
   */
  @Get('sku/:skuId/consumption')
  getConsumptionSeries(
    @Param('skuId', ParseUUIDPipe) skuId: string,
    @Query('sinceDays', new DefaultValuePipe(30), ParseIntPipe) sinceDays: number,
  ): Promise<DailyConsumptionRow[]> {
    return this.stockMovementService.getConsumptionSeries(skuId, sinceDays);
  }
}
