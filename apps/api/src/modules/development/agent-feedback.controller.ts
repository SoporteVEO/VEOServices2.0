import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import { AgentFeedbackReviewService } from './agent-feedback-review.service.js';
import { DEVELOPER_SUB_ROLE } from './agent-issues.service.js';
import {
  ListAgentFeedbackQueryDto,
  ReviewAgentFeedbackDto,
} from './dto/agent-learnings.dto.js';

interface AuthUser {
  id: string;
}

@Controller('development/agent-feedback')
@RequiredSubRoles(DEVELOPER_SUB_ROLE)
export class AgentFeedbackController {
  constructor(private readonly service: AgentFeedbackReviewService) {}

  @Get()
  list(@Query() query: ListAgentFeedbackQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.findOne(id);
    return { data };
  }

  @Patch(':id')
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewAgentFeedbackDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.review(id, dto, user.id);
    return { data };
  }
}
