import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('categories')
@Unique(['tenantId', 'name'])
export class Category extends AbstractEntity {
  @Index()
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
