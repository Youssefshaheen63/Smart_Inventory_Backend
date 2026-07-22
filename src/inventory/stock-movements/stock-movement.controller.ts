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
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { successResponse, paginatedResponse } from '../../utils/response.util';

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
   * `page`, `limit`.
   */
  @Get('sku/:skuId')
  async getHistoryForSku(
    @Param('skuId', ParseUUIDPipe) skuId: string,
    @Query() query: StockMovementQueryDto,
  ) {
    const { data, total } = await this.stockMovementService.getHistoryForSku(skuId, query);
    return paginatedResponse(data, query.page!, query.limit!, total);
  }

  /**
   * GET /inventory/stock-movements/sku/:skuId/reconcile?warehouseId=:warehouseId
   *
   * Integrity check: re-sums the ledger and compares it to the cached
   * `StockLevel.quantity`.  Returns `{ cached, calculated, matches }`.
   *
   * Not on the hot path — intended for admin / cron use.
   */
  @Get('sku/:skuId/reconcile')
  async reconcileBalance(
    @Param('skuId', ParseUUIDPipe) skuId: string,
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
  ) {
    const data = await this.stockMovementService.reconcileBalance(skuId, warehouseId);
    return successResponse(data);
  }

  /**
   * GET /inventory/stock-movements/sku/:skuId/consumption?warehouseId=:warehouseId&sinceDays=30
   *
   * Returns daily net quantity changes over the last `sinceDays` calendar
   * days (default 30), ordered oldest-first.  Intended as a data feed for
   * the demand-forecasting feature.
   */
  @Get('sku/:skuId/consumption')
  async getConsumptionSeries(
    @Param('skuId', ParseUUIDPipe) skuId: string,
    @Query('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query('sinceDays', new DefaultValuePipe(30), ParseIntPipe) sinceDays: number,
  ) {
    const data = await this.stockMovementService.getConsumptionSeries(skuId, warehouseId, sinceDays);
    return successResponse(data);
  }
}
