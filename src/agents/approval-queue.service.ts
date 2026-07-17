
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRequest } from './entities/approval-request.entity';
import { ApprovalRequestResponseDto } from './dto/approval-request-response.dto';
import { ApprovalRequestMapper } from './mappers/approval-request.mapper';

@Injectable()
export class ApprovalQueueService {
  constructor(
    @InjectRepository(ApprovalRequest)
    private readonly approvalRepo: Repository<ApprovalRequest>,
    private readonly mapper: ApprovalRequestMapper,
  ) {}

  async findAll(): Promise<ApprovalRequestResponseDto[]> {
    const requests = await this.approvalRepo.find({
      order: { createdAt: 'DESC' },
    });
    return this.mapper.toResponseList(requests);
  }

  async countPending(): Promise<number> {
    return this.approvalRepo.count({
      where: { status: 'pending' },
    });
  }

  async findPending(): Promise<ApprovalRequestResponseDto[]> {
    const requests = await this.approvalRepo.find({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
    });
    return this.mapper.toResponseList(requests);
  }
}
