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
import { CrmTemplatesService } from '../crm-templates.service.js';
import { CRM_SUB_ROLE, type CrmAuthUser } from '../crm.constants.js';
import {
  CreateTemplateDto,
  RenderTemplateDto,
  TemplateContextQueryDto,
  UpdateTemplateDto,
} from '../dto/crm-template.dto.js';

@Controller('crm/templates')
@RequiredSubRoles(CRM_SUB_ROLE)
export class CrmTemplatesController {
  constructor(private readonly templates: CrmTemplatesService) {}

  @Get()
  async list(@CurrentUser() user: CrmAuthUser) {
    const data = await this.templates.list(user.id);
    return { data };
  }

  @Get('context')
  async context(
    @Query() query: TemplateContextQueryDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.templates.context(query, user.id);
    return { data };
  }

  @Post('render')
  async render(
    @Body() dto: RenderTemplateDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.templates.renderPreview(dto.body, user.id);
    return { data };
  }

  @Get(':id')
  async get(@Param('id') id: string, @CurrentUser() user: CrmAuthUser) {
    const data = await this.templates.get(id, user.id);
    return { data };
  }

  @Post()
  async create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.templates.create(dto, user.id);
    return { data };
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @CurrentUser() user: CrmAuthUser) {
    const data = await this.templates.duplicate(id, user.id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: CrmAuthUser,
  ) {
    const data = await this.templates.update(id, dto, user.id);
    return { data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: CrmAuthUser) {
    return this.templates.remove(id, user.id);
  }
}
