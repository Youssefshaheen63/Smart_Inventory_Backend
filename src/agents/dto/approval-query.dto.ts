import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../utils/query.dto';

export class ApprovalQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['reorder', 'negotiation'])
  agentType?: 'reorder' | 'negotiation';
}
