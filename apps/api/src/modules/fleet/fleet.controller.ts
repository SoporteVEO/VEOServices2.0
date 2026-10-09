import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, RequiredSubRoles } from '../auth/decorators.js';
import {
  CreateFleetMaintenanceDto,
  UpdateFleetMaintenanceDto,
} from './dto/fleet-maintenance.dto.js';
import {
  CreateFleetVehicleDto,
  ListFleetVehiclesQueryDto,
  UpdateFleetVehicleDto,
} from './dto/fleet-vehicle.dto.js';
import { FleetMaintenancesService } from './fleet-maintenances.service.js';
import { FleetVehiclesService } from './fleet-vehicles.service.js';

interface AuthUser {
  id: string;
}

/**
 * Mantenimiento flota: company car inventory and its service log. Shares the
 * MANTENIMIENTO sub-role with the billboard maintenance module.
 */
@Controller('fleet')
@RequiredSubRoles('MANTENIMIENTO')
export class FleetController {
  constructor(
    private readonly vehicles: FleetVehiclesService,
    private readonly maintenances: FleetMaintenancesService,
  ) {}

  @Get('vehicles')
  async listVehicles(@Query() query: ListFleetVehiclesQueryDto) {
    const data = await this.vehicles.list(query);
    return { data };
  }

  @Get('vehicles/:id')
  async getVehicle(@Param('id') id: string) {
    const data = await this.vehicles.getDetail(id);
    return { data };
  }

  @Post('vehicles')
  async createVehicle(
    @Body() dto: CreateFleetVehicleDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.vehicles.create(dto, user.id);
    return { data };
  }

  @Patch('vehicles/:id')
  async updateVehicle(
    @Param('id') id: string,
    @Body() dto: UpdateFleetVehicleDto,
  ) {
    const data = await this.vehicles.update(id, dto);
    return { data };
  }

  @Delete('vehicles/:id')
  async removeVehicle(@Param('id') id: string) {
    return this.vehicles.remove(id);
  }

  @Post('vehicles/:id/maintenances')
  async createMaintenance(
    @Param('id') vehicleId: string,
    @Body() dto: CreateFleetMaintenanceDto,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await this.maintenances.create(vehicleId, dto, user.id);
    return { data };
  }

  @Patch('maintenances/:id')
  async updateMaintenance(
    @Param('id') id: string,
    @Body() dto: UpdateFleetMaintenanceDto,
  ) {
    const data = await this.maintenances.update(id, dto);
    return { data };
  }

  @Delete('maintenances/:id')
  async removeMaintenance(@Param('id') id: string) {
    const data = await this.maintenances.remove(id);
    return { data };
  }
}
