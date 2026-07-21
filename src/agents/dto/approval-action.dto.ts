import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class ApproveApprovalRequestDto {
  @IsUUID()
  reviewedBy!: string;

  @IsOptional()
  @IsObject()
  @Type(() => Object)
  editedPayload?: object;
}

export class RejectApprovalRequestDto {
  @IsUUID()
  reviewedBy!: string;
}
