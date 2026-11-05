import { Module } from '@nestjs/common';
import { MentorshipNotifier } from './mentorship-notifier.js';
import { MentorshipSweepService } from './mentorship-sweep.service.js';
import { MentorshipsCronController } from './mentorships-cron.controller.js';
import { MentorshipsDashboardService } from './mentorships-dashboard.service.js';
import { MentorshipsController } from './mentorships.controller.js';
import { MentorshipsService } from './mentorships.service.js';

@Module({
  controllers: [MentorshipsCronController, MentorshipsController],
  providers: [
    MentorshipsService,
    MentorshipsDashboardService,
    MentorshipSweepService,
    MentorshipNotifier,
  ],
})
export class MentorshipsModule {}
