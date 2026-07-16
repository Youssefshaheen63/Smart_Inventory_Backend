import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AbstractEntity } from '../../../shared/base.entity';
import { Sku } from '../../../sku/entities/sku.entity';
import { MovementReason } from '../enums/movement-reason.enum';

/**
 * APPEND-ONLY LEDGER — never UPDATE or DELETE rows in this table.
 *
 * Each row records a single atomic stock change for one SKU.
 * `balanceAfter` is a denormalized snapshot captured at insert time
 * so that history is fully self-contained for audit purposes.
 *
 * Concurrency: callers MUST hold a pessimistic write-lock on the
 * parent Sku row (inside a transaction) before inserting here, to
 * prevent double-counting on concurrent requests.
 *
 * Idempotency: `idempotencyKey` carries a UNIQUE constraint so that
 * any retry (from a job queue, agent, etc.) that re-submits the same
 * logical operation is safely deduplicated.
 */
@Entity('stock_movements')
@Index('idx_stock_movements_sku_created', ['skuId', 'createdAt'])
@Index('idx_stock_movements_created', ['createdAt'])
export class StockMovement extends AbstractEntity {
  // ── Relation ────────────────────────────────────────────────────────────
  @ManyToOne(() => Sku, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'sku_id' })
  sku!: Sku;

  @Column({ name: 'sku_id', type: 'uuid' })
  skuId!: string;

  // ── Core movement fields ─────────────────────────────────────────────────
  @Column({ type: 'enum', enum: MovementReason })
  reason!: MovementReason;

  /**
   * Positive = stock in (receipt, return, …).
   * Negative = stock out (sale, write-off, …).
   */
  @Column({ type: 'int' })
  quantityChange!: number;

  /** Snapshot of sku.currentQuantity AFTER this movement was applied. */
  @Column({ type: 'int' })
  balanceAfter!: number;

  // ── Attribution ───────────────────────────────────────────────────────────
  @Column({ type: 'uuid', nullable: true })
  performedByUserId!: string | null;

  /** E.g. 'reorder_agent', 'negotiation_agent' — for future agent integration. */
  @Column({ type: 'varchar', length: 100, nullable: true })
  performedByAgent!: string | null;

  // ── Traceability ──────────────────────────────────────────────────────────
  /** E.g. 'purchase_order', 'manual_adjustment' */
  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceType!: string | null;

  /** ID of the PO / adjustment / etc. that caused this movement. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceId!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  // ── Idempotency ───────────────────────────────────────────────────────────
  /**
   * Caller-supplied key that uniquely identifies the logical operation.
   * UNIQUE constraint guarantees concurrent retries produce exactly
   * one row.  NOT exposed in response DTOs — internal concern only.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  idempotencyKey!: string;

  // NOTE: No @UpdateDateColumn here — this table is insert-only.
  // AbstractEntity.updatedAt is inherited but will never change in practice;
  // it equals createdAt for every row in this table.
}
