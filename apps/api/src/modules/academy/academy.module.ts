import { Module } from '@nestjs/common';
import { AcademyController } from './academy.controller.js';
import { AcademyService } from './academy.service.js';

@Module({
  controllers: [AcademyController],
  providers: [AcademyService],
})
export class AcademyModule {}
