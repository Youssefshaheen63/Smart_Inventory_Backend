import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('purchase_orders')
export class PurchaseOrder extends AbstractEntity {
  @Column('uuid')
  vendorId!: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'pending_approval', 'approved', 'sent', 'received', 'rejected'],
    default: 'draft',
  })
  status!: string;

  @Column({ default: 'manual' })
  createdBy!: string;

  @Column('uuid', { nullable: true })
  negotiationRunId!: string | null;
}
