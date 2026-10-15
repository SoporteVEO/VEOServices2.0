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
} from '@nestjs/common';
import {
  AllowFieldRoles,
  AllowLimited,
  CurrentUser,
  RequiredSubRoles,
} from '../auth/decorators.js';
import { IMAGES_MODULE_ROLES } from '../auth/field-roles.js';
import {
  CreatePatchNoteDto,
  UpdatePatchNoteDto,
} from './dto/patch-notes.dto.js';
import {
  DEVELOPER_SUB_ROLE,
  PatchNotesService,
} from './patch-notes.service.js';

interface AuthUser {
  id: string;
}

@AllowLimited()
@AllowFieldRoles(...IMAGES_MODULE_ROLES)
@Controller('patch-notes')
export class PatchNotesController {
  constructor(private readonly service: PatchNotesService) {}

  @Get()
  async list() {
    return { data: await this.service.list() };
  }

  @Get('current-version')
  async currentVersion() {
    return { data: await this.service.currentVersion() };
  }

  @Post()
  @RequiredSubRoles(DEVELOPER_SUB_ROLE)
  async create(@Body() dto: CreatePatchNoteDto, @CurrentUser() user: AuthUser) {
    return { data: await this.service.create(dto, user.id) };
  }

  @Patch(':id')
  @RequiredSubRoles(DEVELOPER_SUB_ROLE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatchNoteDto,
  ) {
    return { data: await this.service.update(id, dto) };
  }

  @Delete(':id')
  @HttpCode(200)
  @RequiredSubRoles(DEVELOPER_SUB_ROLE)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
    return { data: { ok: true } };
  }
}
