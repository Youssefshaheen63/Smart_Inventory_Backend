import { Column, Entity, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';
import { PurchaseOrderLineItem } from './purchase-order-line-item.entity';

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

  @OneToMany(() => PurchaseOrderLineItem, (lineItem) => lineItem.purchaseOrder, { cascade: true })
  lineItems!: PurchaseOrderLineItem[];
}
