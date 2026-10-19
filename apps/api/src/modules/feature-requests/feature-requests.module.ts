import { Module } from '@nestjs/common';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { FeatureRequestApprovalService } from './feature-request-approval.service.js';
import { FeatureRequestNotifier } from './feature-request-notifier.js';
import { FeatureRequestSignaturesService } from './feature-request-signatures.service.js';
import { FeatureRequestsDevController } from './feature-requests-dev.controller.js';
import { FeatureRequestsDevService } from './feature-requests-dev.service.js';
import { FeatureRequestsController } from './feature-requests.controller.js';
import { FeatureRequestsService } from './feature-requests.service.js';

@Module({
  imports: [S3ImagesModule],
  controllers: [FeatureRequestsController, FeatureRequestsDevController],
  providers: [
    FeatureRequestsService,
    FeatureRequestsDevService,
    FeatureRequestSignaturesService,
    FeatureRequestApprovalService,
    FeatureRequestNotifier,
  ],
})
export class FeatureRequestsModule {}
