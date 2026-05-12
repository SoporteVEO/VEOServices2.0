import { Module } from '@nestjs/common';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { AbsencesController } from './absences.controller.js';
import { AbsencesService } from './absences.service.js';

@Module({
  imports: [S3ImagesModule],
  controllers: [AbsencesController],
  providers: [AbsencesService],
  exports: [AbsencesService],
})
export class AbsencesModule {}
