import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { CreateTeamMemberCommentDto } from './dto/create-team-member-comment.dto';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { RequiredSubRoles } from '../auth/decorators.js';

@RequiredSubRoles('HR')
@Controller('team-members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Post()
  async create(@Body() dto: CreateTeamMemberDto) {
    const created = await this.teamMembersService.create(dto);
    return { data: created };
  }

  @Get()
  async findAll() {
    const teamMembers = await this.teamMembersService.findAll();
    return { data: teamMembers };
  }

  @Post(':id/comments')
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateTeamMemberCommentDto,
  ) {
    const created = await this.teamMembersService.addComment(id, dto);
    return { data: created };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const found = await this.teamMembersService.findOne(id);
    return { data: found };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    const updated = await this.teamMembersService.update(id, dto);
    return { data: updated };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.teamMembersService.remove(id);
  }
}
