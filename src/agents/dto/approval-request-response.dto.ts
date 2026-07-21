import { ApiProperty } from '@nestjs/swagger';

export class ApprovalRequestResponseDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  agentRunId!: string;
  @ApiProperty()
  agentType!: string;
  @ApiProperty()
  stepNumber!: number;
  @ApiProperty({ type: Object })
  payload!: object;
  @ApiProperty({ nullable: true })
  reasoning!: string | null;
  @ApiProperty()
  status!: string;
  @ApiProperty({ nullable: true })
  reviewedBy!: string | null;
  @ApiProperty({ nullable: true })
  reviewedAt!: Date | null;
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;
}
