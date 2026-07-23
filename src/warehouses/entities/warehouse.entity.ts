import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

export enum WarehouseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('warehouses')
export class Warehouse extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location!: string | null;

  @Column({
    type: 'enum',
    enum: WarehouseStatus,
    default: WarehouseStatus.ACTIVE,
  })
  status!: WarehouseStatus;
}
