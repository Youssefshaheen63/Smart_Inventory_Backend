import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('purchase_order_line_items')
export class PurchaseOrderLineItem extends AbstractEntity {
  @Column('uuid')
  purchaseOrderId!: string;

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
