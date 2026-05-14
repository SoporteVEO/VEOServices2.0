import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { MeService } from './me.service.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import { UpdateMyTeamMemberDto } from './dto/update-my-team-member.dto.js';
import { AllowLimited, CurrentUser } from '../auth/decorators.js';
import { AbsencesService } from '../absences/absences.service.js';
import { CreateAbsenceDto } from '../absences/dto/create-absence.dto.js';
import { UpdateAbsenceDto } from '../absences/dto/update-absence.dto.js';
import { UserMetricsService } from '../user-metrics/user-metrics.service.js';

interface AuthUser {
  id: string;
}

@AllowLimited()
@Controller('me')
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly absencesService: AbsencesService,
    private readonly userMetricsService: UserMetricsService,
  ) {}

  @Get()
  async getProfile(@CurrentUser() user: AuthUser) {
    const profile = await this.meService.getProfile(user.id);
    return { data: profile };
  }

  @Get('team-member')
  async getTeamMember(@CurrentUser() user: AuthUser) {
    const teamMember = await this.meService.getTeamMember(user.id);
    return { data: teamMember };
  }

  @Patch('team-member')
  async updateMyTeamMember(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMyTeamMemberDto,
  ) {
    const teamMember = await this.meService.updateMyTeamMember(user.id, dto);
    return { data: teamMember };
  }

  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    const updated = await this.meService.update(user.id, dto);
    return { data: updated };
  }

  @Get('absences')
  async listAbsences(@CurrentUser() user: AuthUser) {
    const absences = await this.absencesService.findMine(user.id);
    return { data: absences };
  }

  @Post('absences')
  async createAbsence(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAbsenceDto,
  ) {
    const created = await this.absencesService.create(user.id, dto);
    return { data: created };
  }

  @Patch('absences/:id')
  async updateAbsence(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateAbsenceDto,
  ) {
    const updated = await this.absencesService.updateMine(user.id, id, dto);
    return { data: updated };
  }

  @Delete('absences/:id')
  async removeAbsence(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.absencesService.removeMine(user.id, id);
  }

  @Post('metrics/heartbeat')
  async heartbeat(@CurrentUser() user: AuthUser) {
    const result = await this.userMetricsService.heartbeat(user.id);
    return { data: result };
  }

  @Get('metrics/summary')
  async getMetricsSummary(@CurrentUser() user: AuthUser) {
    const summary = await this.userMetricsService.getMySummary(user.id);
    return { data: summary };
  }
}
