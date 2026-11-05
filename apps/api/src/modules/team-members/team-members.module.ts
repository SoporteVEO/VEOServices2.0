import { Module } from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { TeamMembersController } from './team-members.controller';
import { HrCatalogsController } from './hr-catalogs.controller.js';
import { HrCatalogsService } from './hr-catalogs.service.js';

@Module({
  controllers: [TeamMembersController, HrCatalogsController],
  providers: [TeamMembersService, HrCatalogsService],
})
export class TeamMembersModule {}
