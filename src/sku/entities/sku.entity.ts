import {
  Column,
  Entity,
  Index,
} from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

/**
 * Sku database entity representing unique product variants.
 */
@Entity('skus')
export class Sku extends AbstractEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  skuCode!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index()
  @Column({ length: 100, nullable: true })
  category!: string | null;

  @Column({ length: 50, default: 'pcs' })
  unit!: string;

  @Column('numeric', {
    precision: 12,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  cost!: number;

  @Column('numeric', {
    precision: 12,
    scale: 4,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price!: number;

  @Column('int', { default: 0 })
  reorderThreshold!: number;

  @Column('int', { default: 0 })
  safetyStock!: number;
}