import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApprovalQueueService } from './approval-queue.service';
import { paginatedResponse, successResponse } from '../utils/response.util';
import { ApprovalQueryDto } from './dto/approval-query.dto';
import { ApproveApprovalRequestDto, RejectApprovalRequestDto } from './dto/approval-action.dto';

@Controller('approvals')
export class ApprovalQueueController {
  constructor(private readonly service: ApprovalQueueService) {}

  @Get()
  async findAll(@Query() query: ApprovalQueryDto) {
    const { data, total } = await this.service.findPending(query);
    return paginatedResponse(data, query.page!, query.limit!, total);
  }

  @Post(':id/approve')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ApproveApprovalRequestDto,
  ) {
    const data = await this.service.approve(id, body.reviewedBy, body.editedPayload);
    return successResponse(data);
  }

  @Post(':id/reject')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectApprovalRequestDto,
  ) {
    const data = await this.service.reject(id, body.reviewedBy);
    return successResponse(data);
  }
}
