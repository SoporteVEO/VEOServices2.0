import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser, RequiredRoles } from '../auth/decorators.js';
import { UploadInstallationImageDto } from './dto/upload-installation-image.dto.js';
import { InstallationTasksService } from './installation-tasks.service.js';

interface AuthUser {
  id: string;
  role?: string | null;
  subRoles?: string[] | null;
}

const FIELD_ROLES = ['INSTALLER', 'WORKER'] as const;

/**
 * Endpoints behind the per-billboard QR code. Field roles reach nothing else
 * in the API, so every route here names them explicitly.
 */
@Controller('installations')
export class InstallationTasksController {
  constructor(private readonly service: InstallationTasksService) {}

  @Get('mine')
  @RequiredRoles(...FIELD_ROLES)
  async listMine(@CurrentUser() user: AuthUser) {
    const data = await this.service.listAssignedTo(user.id);
    return { data };
  }

  @Get(':itemId')
  @RequiredRoles(...FIELD_ROLES, 'ADMIN', 'USER')
  async getOne(@Param('itemId') itemId: string, @CurrentUser() user: AuthUser) {
    assertCanViewTask(user);
    const data = await this.service.getTask(itemId);
    return { data };
  }

  @Post(':itemId/vulcanizado-image')
  @RequiredRoles(...FIELD_ROLES, 'ADMIN')
  async uploadVulcanizadoImage(
    @Param('itemId') itemId: string,
    @Body() dto: UploadInstallationImageDto,
  ) {
    const data = await this.service.uploadVulcanizadoImage(
      itemId,
      dto.imageBase64,
    );
    return { data };
  }

  @Delete(':itemId/vulcanizado-image')
  @RequiredRoles(...FIELD_ROLES, 'ADMIN')
  async deleteVulcanizadoImage(@Param('itemId') itemId: string) {
    const data = await this.service.deleteVulcanizadoImage(itemId);
    return { data };
  }

  @Post(':itemId/installation-image')
  @RequiredRoles(...FIELD_ROLES, 'ADMIN')
  async uploadInstallationImage(
    @Param('itemId') itemId: string,
    @Body() dto: UploadInstallationImageDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.service.uploadInstallationImage(
      itemId,
      user.id,
      dto.imageBase64,
    );
    return { data };
  }
}

/**
 * Regular dashboard users only get in when they run production, so they can
 * verify what a QR code resolves to before printing it.
 */
function assertCanViewTask(user: AuthUser): void {
  if (user.role !== 'USER') return;
  if ((user.subRoles ?? []).includes('PRODUCTION')) return;
  throw new ForbiddenException('No tienes permisos para este recurso');
}
