import { Module } from '@nestjs/common';
import { S3ImagesModule } from '../s3-images/s3-images.module.js';
import { FleetController } from './fleet.controller.js';
import { FleetMaintenancesService } from './fleet-maintenances.service.js';
import { FleetVehiclesService } from './fleet-vehicles.service.js';

@Module({
  imports: [S3ImagesModule],
  controllers: [FleetController],
  providers: [FleetVehiclesService, FleetMaintenancesService],
})
export class FleetModule {}
