import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('vendor_catalog_entries')
export class VendorCatalogEntry extends AbstractEntity {
  @Column('uuid')
  vendorId!: string;

  @Column('uuid')
  skuId!: string;

  @Column('numeric', {
    precision: 12,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column('int')
  leadTimeDays!: number;
}
