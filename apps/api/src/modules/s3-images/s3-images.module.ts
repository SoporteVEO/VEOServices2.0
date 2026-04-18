import { Module } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service.js';
import { S3ImagesController } from './s3-images.controller.js';
import { S3ImagesService } from './s3-images.service.js';
import { S3StorageService } from './s3-storage.service.js';

@Module({
  controllers: [S3ImagesController],
  providers: [S3ImagesService, S3StorageService, ImageProcessorService],
  exports: [S3ImagesService, S3StorageService, ImageProcessorService],
})
export class S3ImagesModule {}
