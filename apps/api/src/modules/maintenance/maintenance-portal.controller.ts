import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, RequiredRoles } from '../auth/decorators.js';
import {
  CompleteMaintenanceJobDto,
  UploadMaintenancePhotoDto,
} from './dto/maintenance-job.dto.js';
import { MaintenanceJobsService } from './maintenance-jobs.service.js';

interface AuthUser {
  id: string;
}

/**
 * The technician's mobile portal. Users with the MANTENIMIENTO role reach
 * nothing else in the API, so every route names the role explicitly and the
 * service re-checks that the job is actually assigned to the caller.
 */
@Controller('maintenance-portal')
export class MaintenancePortalController {
  constructor(private readonly jobs: MaintenanceJobsService) {}

  @Get('jobs')
  @RequiredRoles('MANTENIMIENTO', 'ADMIN')
  async listMine(@CurrentUser() user: AuthUser) {
    const data = await this.jobs.listAssignedTo(user.id);
    return { data };
  }

  @Get('jobs/:id')
  @RequiredRoles('MANTENIMIENTO', 'ADMIN')
  async getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.jobs.getJobForCaller(id, user.id);
    return { data };
  }

  @Patch('jobs/:id/start')
  @RequiredRoles('MANTENIMIENTO', 'ADMIN')
  async start(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.jobs.start(id, user.id);
    return { data };
  }

  @Patch('jobs/:id/complete')
  @RequiredRoles('MANTENIMIENTO', 'ADMIN')
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteMaintenanceJobDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.complete(id, dto, user.id);
    return { data };
  }

  @Post('jobs/:id/photos')
  @RequiredRoles('MANTENIMIENTO', 'ADMIN')
  async uploadPhoto(
    @Param('id') id: string,
    @Body() dto: UploadMaintenancePhotoDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.uploadPhoto(id, user.id, dto);
    return { data };
  }
}
