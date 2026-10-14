import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import { DEVELOPER_SUB_ROLE } from './agent-issues.service.js';
import { AgentLearningsService } from './agent-learnings.service.js';
import {
  CreateAgentLearningDto,
  ListAgentLearningsQueryDto,
  UpdateAgentLearningDto,
} from './dto/agent-learnings.dto.js';

interface AuthUser {
  id: string;
}

@Controller('development/agent-learnings')
@RequiredSubRoles(DEVELOPER_SUB_ROLE)
export class AgentLearningsController {
  constructor(private readonly service: AgentLearningsService) {}

  @Get()
  list(@Query() query: ListAgentLearningsQueryDto) {
    return this.service.list(query);
  }

  @Post()
  async create(
    @Body() dto: CreateAgentLearningDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.create(dto, user.id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentLearningDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.update(id, dto, user.id);
    return { data };
  }

  @Delete(':id')
  @HttpCode(200)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { data: { ok: true } };
  }
}
