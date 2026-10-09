import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateFleetMaintenanceDto,
  UpdateFleetMaintenanceDto,
} from './dto/fleet-maintenance.dto.js';
import {
  type FleetVehicleDetailDto,
  FleetVehiclesService,
} from './fleet-vehicles.service.js';

function optionalText(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function optionalDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

/** Service log entries. Each mutation answers with the refreshed vehicle. */
@Injectable()
export class FleetMaintenancesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicles: FleetVehiclesService,
  ) {}

  async create(
    vehicleId: string,
    dto: CreateFleetMaintenanceDto,
    actorUserId: string,
  ): Promise<FleetVehicleDetailDto> {
    await this.vehicles.findOrThrow(vehicleId);

    await this.prisma.fleetMaintenance.create({
      data: {
        vehicleId,
        type: dto.type,
        performedAt: new Date(dto.performedAt),
        mileageKm: dto.mileageKm,
        cost: dto.cost,
        description: dto.description.trim(),
        workshop: optionalText(dto.workshop),
        invoiceNumber: optionalText(dto.invoiceNumber),
        nextServiceKm: dto.nextServiceKm ?? null,
        nextServiceAt: optionalDate(dto.nextServiceAt),
        createdByUserId: actorUserId,
      },
    });

    return this.vehicles.getDetail(vehicleId);
  }

  async update(
    id: string,
    dto: UpdateFleetMaintenanceDto,
  ): Promise<FleetVehicleDetailDto> {
    const existing = await this.findOrThrow(id);

    const data: Prisma.FleetMaintenanceUpdateInput = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.performedAt !== undefined) {
      data.performedAt = new Date(dto.performedAt);
    }
    if (dto.mileageKm !== undefined) data.mileageKm = dto.mileageKm;
    if (dto.cost !== undefined) data.cost = dto.cost;
    if (dto.description !== undefined) {
      data.description = dto.description.trim();
    }
    if (dto.workshop !== undefined) data.workshop = optionalText(dto.workshop);
    if (dto.invoiceNumber !== undefined) {
      data.invoiceNumber = optionalText(dto.invoiceNumber);
    }
    if (dto.nextServiceKm !== undefined) data.nextServiceKm = dto.nextServiceKm;
    if (dto.nextServiceAt !== undefined) {
      data.nextServiceAt = optionalDate(dto.nextServiceAt);
    }

    await this.prisma.fleetMaintenance.update({ where: { id }, data });
    return this.vehicles.getDetail(existing.vehicleId);
  }

  async remove(id: string): Promise<FleetVehicleDetailDto> {
    const existing = await this.findOrThrow(id);
    await this.prisma.fleetMaintenance.delete({ where: { id } });
    return this.vehicles.getDetail(existing.vehicleId);
  }

  private async findOrThrow(id: string) {
    const found = await this.prisma.fleetMaintenance.findUnique({
      where: { id },
      select: { id: true, vehicleId: true },
    });
    if (!found) throw new NotFoundException('Mantenimiento no encontrado');
    return found;
  }
}
