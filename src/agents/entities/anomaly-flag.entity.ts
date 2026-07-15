import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('anomaly_flags')
export class AnomalyFlag extends AbstractEntity {
  @Column('uuid', { nullable: true })
  agentRunId!: string | null;

  @Column('uuid')
  skuId!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column('uuid', { array: true, default: [] })
  relatedMovementIds!: string[];

  @Column({
    type: 'enum',
    enum: ['flagged', 'reviewed', 'escalated'],
    default: 'flagged',
  })
  status!: string;

  @Column('uuid', { nullable: true })
  reviewedBy!: string | null;
}
