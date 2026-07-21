import { IsIn, IsInt, IsNotEmpty, IsObject, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApprovalRequestDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  agentRunId!: string;

  @ApiProperty({ enum: ['reorder', 'negotiation'] })
  @IsIn(['reorder', 'negotiation'])
  agentType!: 'reorder' | 'negotiation';

  @ApiProperty()
  @IsInt()
  @Min(1)
  stepNumber!: number;

  @ApiProperty({ type: Object })
  @IsObject()
  payload!: object;

  @ApiPropertyOptional()
  @IsNotEmpty()
  reasoning!: string;
}
