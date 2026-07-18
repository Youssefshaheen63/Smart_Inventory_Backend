
export class PendingApprovalItemDto {
  id!: string;
  type!: 'agent_request' | 'purchase_order';
  status!: string;
  description!: string;
  createdAt!: Date;
}
