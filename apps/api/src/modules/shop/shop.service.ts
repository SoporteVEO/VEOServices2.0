import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AvailableDigitalBillboard,
  AvailableState,
} from '../billboards/entities/available-billboard.js';
import { PantallasCapacityService } from '../digital-billboards/pantallas-capacity.service.js';
import { isDigitalSpotOption, type DigitalSpotOption } from './digital-spots.js';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly capacity: PantallasCapacityService,
  ) {}

  async listDigitalShopDepartments(): Promise<AvailableState[]> {
    const rows = await this.prisma.digitalBillboard.findMany({
      where: { departmentId: { not: null } },
      select: { departmentId: true, departmentName: true },
    });

    const seen = new Set<number>();
    const out: AvailableState[] = [];
    for (const r of rows) {
      if (r.departmentId == null || seen.has(r.departmentId)) continue;
      seen.add(r.departmentId);
      out.push({
        departmentId: r.departmentId,
        departmentName: r.departmentName ?? '',
        availableCount: 0,
      });
    }
    out.sort((a, b) =>
      a.departmentName.localeCompare(b.departmentName, 'es', {
        sensitivity: 'base',
      }),
    );
    return out;
  }

  async getAvailableDigitalBillboards(
    departmentId: number | null,
    from: Date,
    to: Date,
    desiredSpots: DigitalSpotOption,
  ): Promise<AvailableDigitalBillboard[]> {
    const availability = await this.capacity.availabilityInRange(from, to);

    const where: any = { price: { gt: 0 } };
    if (departmentId != null) {
      where.OR = [{ departmentId }, { departmentId: null }];
    }

    const rows = await this.prisma.digitalBillboard.findMany({
      where,
      include: { image: true },
      orderBy: { name: 'asc' },
    });

    const out: AvailableDigitalBillboard[] = [];
    for (const row of rows) {
      const screen = availability.get(row.id);
      const used = screen?.peakUsed ?? 0;
      const remaining = (screen?.capacity ?? 0) - used;
      if (remaining < desiredSpots) continue;
      out.push({
        id: row.id,
        code: row.code,
        name: row.name,
        address: row.address,
        latitude: row.latitude,
        longitude: row.longitude,
        price: row.price,
        maxSpots: row.maxSpots,
        spotsUsed: used,
        spotsRemaining: remaining,
        imageUrl:
          row.image?.mediumUrl ??
          row.image?.completeUrl ??
          row.image?.thumbnailUrl ??
          null,
        departmentId: row.departmentId ?? null,
        departmentName: row.departmentName ?? null,
      });
    }
    return out;
  }

  async assertDigitalAvailability(
    digitalBillboardId: string,
    from: Date,
    to: Date,
    desiredSpots: number,
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!isDigitalSpotOption(desiredSpots)) {
      return { ok: false, message: 'Cantidad de spots no válida' };
    }
    const availability = await this.capacity.availabilityInRange(from, to);
    const screen = availability.get(digitalBillboardId);
    if (!screen) {
      return { ok: false, message: 'Pantalla no encontrada' };
    }
    if (screen.capacity - screen.peakUsed < desiredSpots) {
      return {
        ok: false,
        message: 'Ya no hay disponibilidad para esos spots',
      };
    }
    return { ok: true };
  }
}
