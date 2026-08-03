export class AgentRunResponseDto {
  id!: string;
  agentType!: string;
  status!: string;
  relatedSkuId!: string | null;
  relatedVendorId!: string | null;
  relatedPoId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
