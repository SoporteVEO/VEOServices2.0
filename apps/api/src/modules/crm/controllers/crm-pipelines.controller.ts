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
import { RequiredSubRoles } from '../../auth/decorators.js';
import { CrmPipelinesService } from '../crm-pipelines.service.js';
import { CRM_SUB_ROLE } from '../crm.constants.js';
import {
  CreatePipelineDto,
  UpdatePipelineDto,
} from '../dto/crm-pipeline.dto.js';

@Controller('crm/pipelines')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmPipelinesController {
  constructor(private readonly pipelines: CrmPipelinesService) {}

  @Get()
  async list(@Query('includeArchived') includeArchived?: string) {
    const data = await this.pipelines.list(includeArchived === 'true');
    return { data };
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const data = await this.pipelines.get(id);
    return { data };
  }

  @Post()
  async create(@Body() dto: CreatePipelineDto) {
    const data = await this.pipelines.create(dto);
    return { data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePipelineDto) {
    const data = await this.pipelines.update(id, dto);
    return { data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.pipelines.remove(id);
  }
}
