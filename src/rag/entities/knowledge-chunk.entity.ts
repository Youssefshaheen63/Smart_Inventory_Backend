import { Column, Entity } from 'typeorm';
import { AbstractEntity } from '../../shared/base.entity';

/**
 * The `embedding` column is NOT declared here because TypeORM has no
 * native pgvector type. It is added via raw SQL in a setup script:
 *   ALTER TABLE knowledge_chunks ADD COLUMN embedding vector(1536);
 * All vector operations (insert, similarity search) are handled via raw SQL
 * through DataSource.query() in RagService.
 */
@Entity('knowledge_chunks')
export class KnowledgeChunk extends AbstractEntity {
  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: ['contract', 'catalog', 'negotiation_transcript', 'report'],
  })
  sourceType!: string;

  @Column('uuid', { nullable: true })
  vendorId!: string | null;

  @Column('uuid', { nullable: true })
  skuId!: string | null;
}
