import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  AcknowledgeMentorshipSessionDto,
  CreateMentorshipSessionDto,
  MentorshipQuarterQueryDto,
  UpdateMentorshipSessionDto,
} from './dto/mentorship.dto.js';
import type { MentorshipViewer } from './mentorship-access.js';
import { MentorshipSweepService } from './mentorship-sweep.service.js';
import { HR_SUB_ROLE } from './mentorships.constants.js';
import { MentorshipsDashboardService } from './mentorships-dashboard.service.js';
import { MentorshipsService } from './mentorships.service.js';

interface AuthUser {
  id: string;
  subRoles?: string[] | null;
}

function toViewer(user: AuthUser): MentorshipViewer {
  return { id: user.id, isHr: (user.subRoles ?? []).includes(HR_SUB_ROLE) };
}

@Controller('mentorships')
export class MentorshipsController {
  constructor(
    private readonly service: MentorshipsService,
    private readonly dashboard: MentorshipsDashboardService,
    private readonly sweep: MentorshipSweepService,
  ) {}

  @Get('overview')
  async overview(@CurrentUser() user: AuthUser) {
    return { data: await this.service.overview(toViewer(user)) };
  }

  @Get('team')
  async team(
    @CurrentUser() user: AuthUser,
    @Query() query: MentorshipQuarterQueryDto,
  ) {
    return { data: await this.service.team(toViewer(user), query.quarter) };
  }

  @Get('mine')
  async mine(@CurrentUser() user: AuthUser) {
    return { data: await this.service.mine(toViewer(user)) };
  }

  @RequiredSubRoles(HR_SUB_ROLE)
  @Get('dashboard')
  async getDashboard(@Query() query: MentorshipQuarterQueryDto) {
    return { data: await this.dashboard.dashboard(query.quarter) };
  }

  @RequiredSubRoles(HR_SUB_ROLE)
  @Get('collaborators')
  async history() {
    return { data: await this.dashboard.history() };
  }

  @RequiredSubRoles(HR_SUB_ROLE)
  @Post('sweep')
  async runSweep() {
    return { data: await this.sweep.run() };
  }

  @Get('collaborators/:userId')
  async collaborator(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return {
      data: await this.service.collaboratorProfile(toViewer(user), userId),
    };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateMentorshipSessionDto,
  ) {
    return { data: await this.service.create(toViewer(user), dto) };
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return { data: await this.service.getSession(toViewer(user), id) };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMentorshipSessionDto,
  ) {
    return { data: await this.service.update(toViewer(user), id, dto) };
  }

  @Post(':id/acknowledge')
  async acknowledge(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcknowledgeMentorshipSessionDto,
  ) {
    return { data: await this.service.acknowledge(toViewer(user), id, dto) };
  }
}
