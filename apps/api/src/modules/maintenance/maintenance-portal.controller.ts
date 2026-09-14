import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  CurrentUser,
  RequiredRoles,
  RequiredSubRoles,
} from '../auth/decorators.js';
import { MAINTENANCE_ROLES } from '../auth/field-roles.js';
import {
  CompleteMaintenanceJobDto,
  UploadMaintenancePhotoDto,
} from './dto/maintenance-job.dto.js';
import { MaintenanceJobsService } from './maintenance-jobs.service.js';

interface AuthUser {
  id: string;
}

/**
 * The technician's mobile portal. Maintenance roles reach nothing else in the
 * API, so the controller names them explicitly and the service re-checks that
 * the job is actually assigned to the caller.
 *
 * Supervisors holding the MANTENIMIENTO sub-role are allowed in as well so they
 * can see exactly what a technician sees; the two requirements are alternatives.
 */
@Controller('maintenance-portal')
@RequiredRoles(...MAINTENANCE_ROLES, 'ADMIN')
@RequiredSubRoles('MANTENIMIENTO')
export class MaintenancePortalController {
  constructor(private readonly jobs: MaintenanceJobsService) {}

  @Get('jobs')
  async listMine(@CurrentUser() user: AuthUser) {
    const data = await this.jobs.listAssignedTo(user.id);
    return { data };
  }

  @Get('jobs/:id')
  async getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.jobs.getJobForCaller(id, user.id);
    return { data };
  }

  @Patch('jobs/:id/start')
  async start(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.jobs.start(id, user.id);
    return { data };
  }

  @Patch('jobs/:id/complete')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteMaintenanceJobDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.complete(id, dto, user.id);
    return { data };
  }

  @Post('jobs/:id/photos')
  async uploadPhoto(
    @Param('id') id: string,
    @Body() dto: UploadMaintenancePhotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.uploadPhoto(id, user.id, dto);
    return { data };
  }
}
