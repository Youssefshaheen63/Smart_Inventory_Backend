import { Column, Entity, Index } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('categories')
export class Category extends AbstractEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
