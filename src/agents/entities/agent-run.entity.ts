import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('agent_runs')
export class AgentRun extends AbstractEntity {
  @Column({
    type: 'enum',
    enum: ['forecasting', 'reorder', 'negotiation', 'anomaly'],
  })
  agentType!: string;

  @Column({
    type: 'enum',
    enum: ['in_progress', 'awaiting_approval', 'completed', 'rejected', 'escalated'],
    default: 'in_progress',
  })
  status!: string;

  @Column('uuid', { nullable: true })
  relatedSkuId!: string | null;

  @Column('uuid', { nullable: true })
  relatedVendorId!: string | null;

  @Column('uuid', { nullable: true })
  relatedPoId!: string | null;
}
