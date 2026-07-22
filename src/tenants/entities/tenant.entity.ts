import { Entity, Column } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('tenants')
export class Tenant extends AbstractEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  companyCode!: string | null;
}
