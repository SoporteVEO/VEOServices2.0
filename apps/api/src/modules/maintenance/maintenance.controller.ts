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
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  CreateMaintenanceCategoryDto,
  UpdateMaintenanceCategoryDto,
} from './dto/maintenance-category.dto.js';
import {
  CreateMaintenanceJobDto,
  ListMaintenanceJobsQueryDto,
  UpdateMaintenanceJobDto,
} from './dto/maintenance-job.dto.js';
import { MaintenanceCategoriesService } from './maintenance-categories.service.js';
import { MaintenanceJobsService } from './maintenance-jobs.service.js';
import { MaintenanceStatsService } from './maintenance-stats.service.js';

interface AuthUser {
  id: string;
}

/**
 * The Mantenimiento module. Gated on the MANTENIMIENTO sub-role, which is the
 * permission a dashboard user needs to assign and supervise work orders. The
 * technicians who execute them hold the MANTENIMIENTO *role* instead and are
 * served by `MaintenancePortalController`.
 */
@Controller('maintenance')
@RequiredSubRoles('MANTENIMIENTO')
export class MaintenanceController {
  constructor(
    private readonly jobs: MaintenanceJobsService,
    private readonly categories: MaintenanceCategoriesService,
    private readonly stats: MaintenanceStatsService,
  ) {}

  @Get('jobs')
  async listJobs(@Query() query: ListMaintenanceJobsQueryDto) {
    return this.jobs.list(query);
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    const data = await this.jobs.getJob(id);
    return { data };
  }

  @Post('jobs')
  async createJob(
    @Body() dto: CreateMaintenanceJobDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.create(dto, user.id);
    return { data };
  }

  @Patch('jobs/:id')
  async updateJob(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceJobDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.update(id, dto, user.id);
    return { data };
  }

  @Patch('jobs/:id/cancel')
  async cancelJob(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.jobs.cancel(id, user.id);
    return { data };
  }

  @Patch('jobs/:id/reopen')
  async reopenJob(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const data = await this.jobs.reopen(id, user.id);
    return { data };
  }

  @Post('photos/:photoId/publish')
  async publishPhoto(
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.publishPhotoToImages(photoId, user.id);
    return { data };
  }

  @Delete('photos/:photoId')
  async deletePhoto(
    @Param('photoId') photoId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.jobs.deletePhoto(photoId, user.id);
    return { data };
  }

  @Get('technicians')
  async listTechnicians() {
    const data = await this.jobs.listTechnicians();
    return { data };
  }

  @Get('categories')
  async listCategories(@Query('includeArchived') includeArchived?: string) {
    const data = await this.categories.list(includeArchived === 'true');
    return { data };
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateMaintenanceCategoryDto) {
    const data = await this.categories.create(dto);
    return { data };
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceCategoryDto,
  ) {
    const data = await this.categories.update(id, dto);
    return { data };
  }

  @Delete('categories/:id')
  async removeCategory(@Param('id') id: string) {
    return this.categories.remove(id);
  }

  @Get('overview')
  async getOverview(@Query('from') from?: string, @Query('to') to?: string) {
    const data = await this.stats.getOverview({ from, to });
    return { data };
  }
}
