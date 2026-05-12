import { Module } from '@nestjs/common';
import { AbsencesModule } from '../absences/absences.module.js';
import { UserMetricsModule } from '../user-metrics/user-metrics.module.js';
import { MeService } from './me.service.js';
import { MeController } from './me.controller.js';

@Module({
  imports: [AbsencesModule, UserMetricsModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
