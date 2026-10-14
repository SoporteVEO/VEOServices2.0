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
import {
  AgentIssuesService,
  DEVELOPER_SUB_ROLE,
} from './agent-issues.service.js';
import {
  ListAgentIssuesQueryDto,
  UpdateAgentIssueDto,
} from './dto/agent-issues.dto.js';

interface AuthUser {
  id: string;
}

@Controller('development/agent-issues')
@RequiredSubRoles(DEVELOPER_SUB_ROLE)
export class AgentIssuesController {
  constructor(private readonly service: AgentIssuesService) {}

  @Get()
  list(@Query() query: ListAgentIssuesQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.findOne(id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentIssueDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.update(id, dto, user.id);
    return { data };
  }
}
