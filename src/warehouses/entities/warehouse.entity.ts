import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('warehouses')
export class Warehouse extends AbstractEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'boolean', default: false })
  isMain!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
