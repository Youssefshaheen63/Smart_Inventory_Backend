import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('vendors')
export class Vendor extends AbstractEntity {
  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contactPhone!: string | null;
}
