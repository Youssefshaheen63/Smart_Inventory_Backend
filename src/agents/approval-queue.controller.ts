
import { Controller, Get } from '@nestjs/common';
import { ApprovalQueueService } from './approval-queue.service';
import { successResponse } from '../utils/response.util';

@Controller('approvals')
export class ApprovalQueueController {
  constructor(private readonly service: ApprovalQueueService) {}

  @Get()
  async findAll() {
    const data = await this.service.findPending();
    return successResponse(data);
  }
}
