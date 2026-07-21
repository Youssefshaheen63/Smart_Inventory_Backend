import { IsIn, IsInt, IsNotEmpty, IsObject, IsUUID, Min } from 'class-validator';

export class CreateApprovalRequestDto {
  @IsUUID()
  @IsNotEmpty()
  agentRunId!: string;

  @IsIn(['reorder', 'negotiation'])
  agentType!: 'reorder' | 'negotiation';

  @IsInt()
  @Min(1)
  stepNumber!: number;

  @IsObject()
  payload!: object;

  @IsNotEmpty()
  reasoning!: string;
}
