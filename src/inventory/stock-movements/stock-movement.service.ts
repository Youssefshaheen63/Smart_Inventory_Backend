import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { StockLevel } from '../stock-levels/entities/stock-level.entity';
import { MovementReason } from './enums/movement-reason.enum';
import { StockMovementQueryDto } from './dto/stock-movement-query.dto';
import { StockMovementResponseDto } from './dto/stock-movement-response.dto';
import { StockMovementMapper } from './mappers/stock-movement.mapper';
import { paginate } from '../../utils/pagination.util';

export interface RecordMovementParams {
  skuId: string;
  warehouseId: string;
  reason: MovementReason;
  quantityChange: number;
  /** Caller-supplied unique key — duplicate submissions are silently deduplicated. */
  idempotencyKey: string;
  performedByUserId?: string;
  performedByAgent?: string;
  referenceType?: string;
  referenceId?: string;
  note?: string;
}

//  Reconciliation result type

export interface ReconciliationResult {
  skuId: string;
  warehouseId: string;
  /** Value currently stored in the StockLevel (the denormalized cache). */
  cached: number;
  /** SUM(quantityChange) recomputed directly from the ledger. */
  calculated: number;
  /** True when cached === calculated — the cache is consistent. */
  matches: boolean;
}

//  Daily consumption series row

export interface DailyConsumptionRow {
  /** Calendar date (YYYY-MM-DD) */
  day: string;
  /** Net quantity change for that day (positive or negative). */
  netChange: number;
}

@Injectable()
export class StockMovementService {
  constructor(
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,

    @InjectRepository(StockLevel)
    private readonly stockLevelRepo: Repository<StockLevel>,

    private readonly dataSource: DataSource,

    private readonly mapper: StockMovementMapper,
  ) {}

  /**
   * The ONE authoritative method for changing stock levels.
   *
   * Must be called instead of updating `StockLevel.quantity` directly anywhere
   * in the system.  Guarantees:
   *
   * 1. Idempotency   — duplicate idempotencyKey → same response, no extra row.
   * 2. Atomicity     — StockLevel balance update and ledger insert happen in one TX.
   * 3. Consistency   — pessimistic lock on the StockLevel row prevents concurrent
   *                    double-counting for the same SKU in the same warehouse.
   * 4. Non-negative  — rejects any movement that would drop stock below zero.
   */
  async recordMovement(
    params: RecordMovementParams,
  ): Promise<StockMovementResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const movRepo = manager.getRepository(StockMovement);
      const slRepo = manager.getRepository(StockLevel);

      // Step 1: Idempotency check
      const existing = await movRepo.findOne({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existing) {
        return this.mapper.toResponse(existing);
      }

      // Step 2: Lock the StockLevel row
      let stockLevel = await slRepo.findOne({
        where: { skuId: params.skuId, warehouseId: params.warehouseId },
        lock: { mode: 'pessimistic_write' },
      });

      // Step 3: Auto-create StockLevel if none exists (first movement for this sku+warehouse)
      if (!stockLevel) {
        stockLevel = slRepo.create({
          skuId: params.skuId,
          warehouseId: params.warehouseId,
          quantity: 0,
          reorderThreshold: 0,
          safetyStock: 0,
        });
        stockLevel = await slRepo.save(stockLevel);
      }

      // Step 4: Compute new balance
      const newBalance = stockLevel.quantity + params.quantityChange;

      // Step 5: Guard against negative stock
      if (newBalance < 0) {
        throw new BadRequestException(
          `Movement would result in negative stock (current: ${stockLevel.quantity}, change: ${params.quantityChange}).`,
        );
      }

      // Step 6: Insert the ledger row
      const movement = movRepo.create({
        skuId: params.skuId,
        warehouseId: params.warehouseId,
        reason: params.reason,
        quantityChange: params.quantityChange,
        balanceAfter: newBalance,
        idempotencyKey: params.idempotencyKey,
        performedByUserId: params.performedByUserId ?? null,
        performedByAgent: params.performedByAgent ?? null,
        referenceType: params.referenceType ?? null,
        referenceId: params.referenceId ?? null,
        note: params.note ?? null,
      });
      const saved = await movRepo.save(movement);

      // Step 7: Update the denormalized cache on the StockLevel
      stockLevel.quantity = newBalance;
      await slRepo.save(stockLevel);

      // Step 8: Return mapped response
      return this.mapper.toResponse(saved);
    });
  }

  //  Per-SKU history (read path)

  /**
   * Returns paginated movement history for a single SKU, newest-first.
   * Filterable by date range and movement reason.
   */
  async getHistoryForSku(
    skuId: string,
    query: StockMovementQueryDto,
  ): Promise<{ data: StockMovementResponseDto[]; total: number }> {
    const qb = this.movementRepo
      .createQueryBuilder('sm')
      .where('sm.skuId = :skuId', { skuId })
      .orderBy('sm.createdAt', 'DESC');

    if (query.from) {
      qb.andWhere('sm.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('sm.createdAt <= :to', { to: new Date(query.to) });
    }
    if (query.reason) {
      qb.andWhere('sm.reason = :reason', { reason: query.reason });
    }

    const result = await paginate(qb, query.page!, query.limit!);
    return { data: this.mapper.toResponseList(result.data), total: result.total };
  }

  //  Integrity reconciliation

  /**
   * Integrity-check utility: recomputes the true stock balance by summing
   * every ledger row for the SKU and compares it against the denormalized
   * cache in `StockLevel.quantity`.
   *
   * NOT on the hot path — call manually / from an admin job.
   */
  async reconcileBalance(skuId: string, warehouseId: string): Promise<ReconciliationResult> {
    const stockLevel = await this.stockLevelRepo.findOne({
      where: { skuId, warehouseId },
    });
    if (!stockLevel) {
      throw new NotFoundException(
        `Stock level not found for SKU "${skuId}" in warehouse "${warehouseId}"`,
      );
    }

    const result = await this.movementRepo
      .createQueryBuilder('sm')
      .select('COALESCE(SUM(sm.quantityChange), 0)', 'total')
      .where('sm.skuId = :skuId', { skuId })
      .andWhere('sm.warehouseId = :warehouseId', { warehouseId })
      .getRawOne<{ total: string }>();

    const calculated = parseInt(result?.total ?? '0', 10);

    return {
      skuId,
      warehouseId,
      cached: stockLevel.quantity,
      calculated,
      matches: stockLevel.quantity === calculated,
    };
  }

  //  Demand-forecasting data feed

  /**
   * Returns daily net quantity changes over the last `sinceDays` calendar days
   * for the given SKU in a given warehouse.
   *
   * This raw aggregation is the data source for a future Demand Forecasting
   * feature.  No forecasting logic is implemented here — just the data method.
   *
   * Results are ordered oldest-first so callers can feed them directly into
   * a time-series model.
   */
  async getConsumptionSeries(
    skuId: string,
    warehouseId: string,
    sinceDays: number,
  ): Promise<DailyConsumptionRow[]> {
    const rows = await this.movementRepo
      .createQueryBuilder('sm')
      .select("TO_CHAR(sm.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')", 'day')
      .addSelect('SUM(sm.quantityChange)', 'netChange')
      .where('sm.skuId = :skuId', { skuId })
      .andWhere('sm.warehouseId = :warehouseId', { warehouseId })
      .andWhere(
        "sm.createdAt >= NOW() - (:sinceDays * INTERVAL '1 day')",
        { sinceDays },
      )
      .groupBy("TO_CHAR(sm.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')")
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; netChange: string }>();

    return rows.map((r) => ({
      day: r.day,
      netChange: parseInt(r.netChange, 10),
    }));
  }
}
