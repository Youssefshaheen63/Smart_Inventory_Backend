import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

@Entity('agent_steps')
export class AgentStep extends AbstractEntity {
  @Column('uuid')
  agentRunId!: string;

  @Column('int')
  stepNumber!: number;

  @Column({ type: 'jsonb', nullable: true })
  input!: object | null;

  @Column({ type: 'jsonb', nullable: true })
  output!: object | null;

  @Column({ type: 'text', nullable: true })
  reasoning!: string | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  timestamp!: Date;
}
