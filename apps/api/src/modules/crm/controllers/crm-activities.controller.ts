import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../../auth/decorators.js';
import { CrmActivitiesService } from '../crm-activities.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  CreateActivityDto,
  ListActivitiesQueryDto,
} from '../dto/crm-activity.dto.js';

@Controller('crm/activities')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmActivitiesController {
  constructor(private readonly activities: CrmActivitiesService) {}

  @Get()
  async list(@Query() query: ListActivitiesQueryDto) {
    const data = await this.activities.list(query);
    return { data };
  }

  @Post()
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.activities.create(dto, user.id);
    return { data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: CrmAuthUser) {
    return this.activities.remove(id, user.id);
  }
}
