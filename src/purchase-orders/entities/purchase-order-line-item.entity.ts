import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('purchase_order_line_items')
export class PurchaseOrderLineItem extends AbstractEntity {
  @Column('uuid')
  purchaseOrderId!: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.lineItems)
  @JoinColumn({ name: 'purchaseOrderId' })
  purchaseOrder!: PurchaseOrder;

  @Column('uuid')
  skuId!: string;

  @Column('int')
  quantity!: number;

  @Column('numeric', {
    precision: 12,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  unitPrice!: number;
}
