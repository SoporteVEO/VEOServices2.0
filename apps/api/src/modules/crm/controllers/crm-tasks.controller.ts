import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../../auth/decorators.js';
import { CrmTasksService } from '../crm-tasks.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  CreateTaskDto,
  ListTasksQueryDto,
  UpdateTaskDto,
} from '../dto/crm-task.dto.js';

@Controller('crm/tasks')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmTasksController {
  constructor(private readonly tasks: CrmTasksService) {}

  @Get()
  async list(
    @Query() query: ListTasksQueryDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.tasks.list(query, user);
    return { data };
  }

  @Get('counts')
  async counts(@CurrentUser() user: CrmAuthUser) {
    const data = await this.tasks.counts(user.id);
    return { data };
  }

  @Post()
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: CrmAuthUser) {
    const data = await this.tasks.create(dto, user);
    return { data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.tasks.update(id, dto, user);
    return { data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.tasks.remove(id);
  }
}
