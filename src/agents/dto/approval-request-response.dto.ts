export class ApprovalRequestResponseDto {
  id!: string;
  agentRunId!: string;
  agentType!: string;
  stepNumber!: number;
  payload!: object;
  reasoning!: string | null;
  status!: string;
  reviewedBy!: string | null;
  reviewedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}
