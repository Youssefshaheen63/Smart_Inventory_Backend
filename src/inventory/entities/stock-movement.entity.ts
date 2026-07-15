import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

/**
 * APPEND-ONLY LEDGER — never UPDATE or DELETE rows in this table.
 * Every stock change is a new INSERT. The skus.currentQuantity column
 * is a denormalized cache updated atomically via Repository.increment().
 */
@Entity('stock_movements')
export class StockMovement extends AbstractEntity {
  @Column('uuid')
  skuId!: string;

  @Column('int')
  quantityChange!: number;

  @Column({
    type: 'enum',
    enum: ['sale', 'received', 'adjustment', 'correction'],
  })
  reason!: string;

  @Column('uuid', { nullable: true })
  performedBy!: string | null;

  @Column({ nullable: true })
  note!: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  timestamp!: Date;
}
