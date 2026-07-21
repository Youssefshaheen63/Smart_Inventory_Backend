import { Injectable } from '@nestjs/common';
import { ApprovalRequest } from '../entities/approval-request.entity';
import { ApprovalRequestResponseDto } from '../dto/approval-request-response.dto';

@Injectable()
export class ApprovalRequestMapper {
  toResponse(entity: ApprovalRequest): ApprovalRequestResponseDto {
    const dto = new ApprovalRequestResponseDto();
    dto.id = entity.id;
    dto.agentRunId = entity.agentRunId;
    dto.agentType = entity.agentType;
    dto.stepNumber = entity.stepNumber;
    dto.payload = entity.payload;
    dto.reasoning = entity.reasoning;
    dto.status = entity.status;
    dto.reviewedBy = entity.reviewedBy;
    dto.reviewedAt = entity.reviewedAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  toResponseList(entities: ApprovalRequest[]): ApprovalRequestResponseDto[] {
    return entities.map((entity) => this.toResponse(entity));
  }
}
