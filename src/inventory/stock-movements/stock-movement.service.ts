import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { Sku } from '../../sku/entities/sku.entity';
import { MovementReason } from './enums/movement-reason.enum';
import { MovementQueryDto } from './dto/movement-query.dto';
import { StockMovementResponseDto } from './dto/stock-movement-response.dto';
import { StockMovementMapper } from './mappers/stock-movement.mapper';


export interface RecordMovementParams {
  skuId: string;
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
  /** Value currently stored in sku.currentQuantity (the denormalized cache). */
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

    @InjectRepository(Sku)
    private readonly skuRepo: Repository<Sku>,

    private readonly dataSource: DataSource,

    private readonly mapper: StockMovementMapper,
  ) {}


  /**
   * The ONE authoritative method for changing stock levels.
   *
   * Must be called instead of updating `sku.currentQuantity` directly anywhere
   * in the system.  Guarantees:
   *
   * 1. Idempotency   — duplicate idempotencyKey → same response, no extra row.
   * 2. Atomicity     — SKU balance update and ledger insert happen in one TX.
   * 3. Consistency   — pessimistic lock on the SKU row prevents concurrent
   *                    double-counting for the same SKU.
   * 4. Non-negative  — rejects any movement that would drop stock below zero.
   */
  async recordMovement(
    params: RecordMovementParams,
  ): Promise<StockMovementResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const movRepo = manager.getRepository(StockMovement);
      const skuRepo = manager.getRepository(Sku);

      //Step 1: Idempotency check 
      const existing = await movRepo.findOne({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existing) {
        // A movement with this key already exists — return it as-is.
        return this.mapper.toResponse(existing);
      }

      // ── Step 2: Lock the SKU row 
      const sku = await skuRepo.findOne({
        where: { id: params.skuId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sku) {
        throw new NotFoundException(
          `SKU with ID "${params.skuId}" not found`,
        );
      }

      //  Step 3: Compute new balance 
      const newBalance = sku.currentQuantity + params.quantityChange;

      //  Step 4: Guard against negative stock 
      if (newBalance < 0) {
        throw new BadRequestException(
          `Movement would result in negative stock (current: ${sku.currentQuantity}, change: ${params.quantityChange}).`,
        );
      }

      //  Step 5: Insert the ledger row 
      const movement = movRepo.create({
        skuId: params.skuId,
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

      //  Step 6: Update the denormalized cache on the SKU 
      sku.currentQuantity = newBalance;
      await skuRepo.save(sku);

      //  Step 7: Return mapped response 
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
    query: MovementQueryDto,
  ): Promise<StockMovementResponseDto[]> {
    // Verify the SKU exists so callers get a clear 404 on bad IDs.
    const skuExists = await this.skuRepo.existsBy({ id: skuId });
    if (!skuExists) {
      throw new NotFoundException(`SKU with ID "${skuId}" not found`);
    }

    const limit = query.limit ?? 50;

    const qb = this.movementRepo
      .createQueryBuilder('sm')
      .where('sm.skuId = :skuId', { skuId })
      .orderBy('sm.createdAt', 'DESC')
      .take(limit);

    if (query.from) {
      qb.andWhere('sm.createdAt >= :from', { from: new Date(query.from) });
    }
    if (query.to) {
      qb.andWhere('sm.createdAt <= :to', { to: new Date(query.to) });
    }
    if (query.reason) {
      qb.andWhere('sm.reason = :reason', { reason: query.reason });
    }

    const movements = await qb.getMany();
    return this.mapper.toResponseList(movements);
  }

  //  Integrity reconciliation 

  /**
   * Integrity-check utility: recomputes the true stock balance by summing
   * every ledger row for the SKU and compares it against the denormalized
   * cache in `sku.currentQuantity`.
   *
   * NOT on the hot path — call manually / from an admin job.
   */
  async reconcileBalance(skuId: string): Promise<ReconciliationResult> {
    const sku = await this.skuRepo.findOne({ where: { id: skuId } });
    if (!sku) {
      throw new NotFoundException(`SKU with ID "${skuId}" not found`);
    }

    const result = await this.movementRepo
      .createQueryBuilder('sm')
      .select('COALESCE(SUM(sm.quantityChange), 0)', 'total')
      .where('sm.skuId = :skuId', { skuId })
      .getRawOne<{ total: string }>();

    const calculated = parseInt(result?.total ?? '0', 10);

    return {
      skuId,
      cached: sku.currentQuantity,
      calculated,
      matches: sku.currentQuantity === calculated,
    };
  }

  //  Demand-forecasting data feed 

  /**
   * Returns daily net quantity changes over the last `sinceDays` calendar days
   * for the given SKU.
   *
   * This raw aggregation is the data source for a future Demand Forecasting
   * feature.  No forecasting logic is implemented here — just the data method.
   *
   * Results are ordered oldest-first so callers can feed them directly into
   * a time-series model.
   */
  async getConsumptionSeries(
    skuId: string,
    sinceDays: number,
  ): Promise<DailyConsumptionRow[]> {
    const skuExists = await this.skuRepo.existsBy({ id: skuId });
    if (!skuExists) {
      throw new NotFoundException(`SKU with ID "${skuId}" not found`);
    }

    const rows = await this.movementRepo
      .createQueryBuilder('sm')
      .select("TO_CHAR(sm.createdAt AT TIME ZONE 'UTC', 'YYYY-MM-DD')", 'day')
      .addSelect('SUM(sm.quantityChange)', 'netChange')
      .where('sm.skuId = :skuId', { skuId })
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
