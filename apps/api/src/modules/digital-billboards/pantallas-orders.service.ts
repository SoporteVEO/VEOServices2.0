import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DigitalCampaignDeal,
  DigitalOrderStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { IngestOrderDto } from './dto/pantallas.dto.js';
import type {
  ReturnDigitalOrderDto,
  SaveDigitalOrderDto,
} from './dto/pantallas-orders.dto.js';
import type { PantallasActor } from './pantallas-log.js';
import { PantallasService } from './pantallas.service.js';
import { fromIsoDate, toIsoDate, todayIso } from './pantallas-rules.js';

const ORDERS_HREF = '/dashboard/produccion-pantallas';
const CODE_RETRIES = 3;

const orderInclude = {
  screens: {
    orderBy: { position: 'asc' },
    include: { digitalBillboard: { select: { id: true, name: true } } },
  },
} satisfies Prisma.DigitalOrderInclude;

type OrderRow = Prisma.DigitalOrderGetPayload<{ include: typeof orderInclude }>;

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function codePrefix(entryIso: string) {
  const [year, month, day] = entryIso.split('-');
  return `${day}${month}${year.slice(2)}`;
}

function mapOrder(row: OrderRow) {
  return {
    id: row.id,
    code: row.code,
    revision: row.revision,
    status: row.status,
    executive: row.executive,
    entryDate: toIsoDate(row.entryDate),
    hasAgency: row.hasAgency,
    agencyName: row.agencyName,
    client: row.client,
    campaign: row.campaign,
    artFormat: row.artFormat,
    startDate: toIsoDate(row.startDate),
    endDate: toIsoDate(row.endDate),
    links: row.links,
    instructions: row.instructions,
    totalValue: row.totalValue,
    monthlyValue: row.monthlyValue,
    returnReason: row.returnReason,
    returnedAt: row.returnedAt?.toISOString() ?? null,
    ingestedAt: row.ingestedAt?.toISOString() ?? null,
    ingestedBy: row.ingestedBy,
    orderGroupId: row.orderGroupId,
    createdByName: row.createdByName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    screens: row.screens.map((s) => ({
      screenId: s.digitalBillboardId,
      screenName: s.digitalBillboard?.name ?? s.screenName,
      spotsPerDay: s.spotsPerDay,
      monthlyValue: s.monthlyValue,
      spotValue: s.spotValue,
      spotValueManual: s.spotValueManual,
      deal: s.deal,
    })),
  };
}

@Injectable()
export class PantallasOrdersService {
  private readonly logger = new Logger(PantallasOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pantallas: PantallasService,
    private readonly notifications: NotificationsService,
  ) {}

  async list() {
    const rows = await this.prisma.digitalOrder.findMany({
      orderBy: { updatedAt: 'desc' },
      include: orderInclude,
    });
    return rows.map(mapOrder);
  }

  async create(dto: SaveDigitalOrderDto, actor: PantallasActor) {
    const entryIso = dto.entryDate ?? todayIso();

    for (let attempt = 1; ; attempt++) {
      try {
        const row = await this.prisma.$transaction(async (tx) => {
          const screens = await this.screenRows(tx, dto);
          const code = await this.nextCode(tx, entryIso);
          return tx.digitalOrder.create({
            data: {
              code,
              ...this.orderFields(dto, entryIso, screens),
              createdByUserId: actor.id,
              createdByName: actor.name ?? null,
              screens: { create: screens.rows },
            },
            include: orderInclude,
          });
        });
        await this.notifyProduccion(row, 'created', actor);
        return mapOrder(row);
      } catch (err) {
        const clash =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002';
        if (!clash || attempt >= CODE_RETRIES) throw err;
      }
    }
  }

  async update(id: string, dto: SaveDigitalOrderDto, actor: PantallasActor) {
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await this.findOrThrow(tx, id);
      if (current.status === DigitalOrderStatus.INGESTED) {
        throw new BadRequestException(
          'La OP ya fue ingresada a las listas y no se puede modificar',
        );
      }
      const entryIso = dto.entryDate ?? toIsoDate(current.entryDate)!;
      const screens = await this.screenRows(tx, dto);
      await tx.digitalOrderScreen.deleteMany({ where: { orderId: id } });
      return tx.digitalOrder.update({
        where: { id },
        data: {
          ...this.orderFields(dto, entryIso, screens),
          revision: { increment: 1 },
          status: DigitalOrderStatus.PENDING,
          returnReason: null,
          returnedAt: null,
          screens: { create: screens.rows },
        },
        include: orderInclude,
      });
    });
    await this.notifyProduccion(row, 'resent', actor);
    return mapOrder(row);
  }

  async ingest(id: string, dto: IngestOrderDto, actor: PantallasActor) {
    const orderGroupId = randomUUID();
    const { row, results } = await this.prisma.$transaction(async (tx) => {
      const current = await this.findOrThrow(tx, id);
      if (current.status !== DigitalOrderStatus.PENDING) {
        throw new ConflictException(
          'Esta OP ya no está esperando a Producción',
        );
      }
      const placed = await this.pantallas.placeOrder(
        tx,
        dto,
        orderGroupId,
        actor,
      );
      const updated = await tx.digitalOrder.update({
        where: { id },
        data: {
          status: DigitalOrderStatus.INGESTED,
          ingestedAt: new Date(),
          ingestedBy: actor.name ?? null,
          orderGroupId,
        },
        include: orderInclude,
      });
      return { row: updated, results: placed };
    });
    await this.notifyComercial(row, 'ingested', actor);
    return { order: mapOrder(row), orderGroupId, results };
  }

  async returnOrder(
    id: string,
    dto: ReturnDigitalOrderDto,
    actor: PantallasActor,
  ) {
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await this.findOrThrow(tx, id);
      if (current.status !== DigitalOrderStatus.PENDING) {
        throw new ConflictException(
          'Esta OP ya no está esperando a Producción',
        );
      }
      return tx.digitalOrder.update({
        where: { id },
        data: {
          status: DigitalOrderStatus.RETURNED,
          returnReason: dto.reason.trim(),
          returnedAt: new Date(),
        },
        include: orderInclude,
      });
    });
    await this.notifyComercial(row, 'returned', actor);
    return mapOrder(row);
  }

  private async findOrThrow(tx: Prisma.TransactionClient, id: string) {
    const row = await tx.digitalOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!row) throw new NotFoundException('OP no encontrada');
    return row;
  }

  private async nextCode(tx: Prisma.TransactionClient, entryIso: string) {
    const prefix = codePrefix(entryIso);
    const existing = await tx.digitalOrder.findMany({
      where: { code: { startsWith: `${prefix}-` } },
      select: { code: true },
    });
    const max = existing.reduce((highest, { code }) => {
      const sequence = Number(code.slice(prefix.length + 1));
      return Number.isFinite(sequence) ? Math.max(highest, sequence) : highest;
    }, 0);
    return `${prefix}-${String(max + 1).padStart(2, '0')}`;
  }

  private async screenRows(
    tx: Prisma.TransactionClient,
    dto: SaveDigitalOrderDto,
  ) {
    const ids = dto.screens.map((s) => s.screenId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Una pantalla está repetida en la OP');
    }
    const found = await tx.digitalBillboard.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const names = new Map(found.map((s) => [s.id, s.name]));
    if (names.size !== ids.length) {
      throw new BadRequestException('Alguna pantalla de la OP no existe');
    }

    const days = this.validityDays(dto.startDate, dto.endDate);
    const rows = dto.screens.map((s, position) => {
      const monthly = s.monthlyValue ?? null;
      const manual = Boolean(s.spotValueManual) && s.spotValue != null;
      const spots = s.spotsPerDay * days;
      const spotValue = manual
        ? (s.spotValue ?? null)
        : monthly !== null && spots > 0
          ? round(monthly / spots, 4)
          : null;
      return {
        digitalBillboardId: s.screenId,
        screenName: names.get(s.screenId) ?? '',
        spotsPerDay: s.spotsPerDay,
        monthlyValue: monthly,
        spotValue,
        spotValueManual: manual,
        deal: s.deal ?? DigitalCampaignDeal.COMMERCIAL,
        position,
      };
    });
    const total = rows.reduce((sum, r) => sum + (r.monthlyValue ?? 0), 0);
    return { rows, total: round(total, 2) };
  }

  private orderFields(
    dto: SaveDigitalOrderDto,
    entryIso: string,
    screens: { total: number },
  ) {
    if (dto.hasAgency && !dto.agencyName?.trim()) {
      throw new BadRequestException('Falta el nombre de la agencia');
    }
    return {
      executive: dto.executive.trim(),
      entryDate: fromIsoDate(entryIso)!,
      hasAgency: dto.hasAgency,
      agencyName: dto.hasAgency ? dto.agencyName!.trim() : null,
      client: dto.client.trim(),
      campaign: dto.campaign?.trim() ?? '',
      artFormat: dto.artFormat,
      startDate: fromIsoDate(dto.startDate)!,
      endDate: fromIsoDate(dto.endDate)!,
      links: (dto.links ?? []).map((l) => l.trim()).filter(Boolean),
      instructions: dto.instructions?.trim() || null,
      totalValue: screens.total,
      monthlyValue: dto.monthlyValue ?? screens.total,
    };
  }

  private validityDays(startIso: string, endIso: string) {
    const start = fromIsoDate(startIso);
    const end = fromIsoDate(endIso);
    if (!start || !end || start > end) {
      throw new BadRequestException(
        'La fecha de inicio va después de la fecha final',
      );
    }
    return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }

  private async notifyProduccion(
    row: OrderRow,
    event: 'created' | 'resent',
    actor: PantallasActor,
  ) {
    const verb = event === 'created' ? 'creó' : 'corrigió';
    await this.notify(
      'PANTALLAS_PRODUCCION',
      `Soporte Comercial ${verb} la OP ${row.code} de ${row.client} · está esperando en Producción Pantallas`,
      actor.id,
    );
  }

  private async notifyComercial(
    row: OrderRow,
    event: 'ingested' | 'returned',
    actor: PantallasActor,
  ) {
    const text =
      event === 'ingested'
        ? `La OP ${row.code} de ${row.client} ya fue ingresada a las listas`
        : `La OP ${row.code} de ${row.client} fue devuelta: ${row.returnReason ?? ''}`;
    await this.notify('PANTALLAS_COMERCIAL', text, actor.id);
  }

  private async notify(
    subRole: 'PANTALLAS_PRODUCCION' | 'PANTALLAS_COMERCIAL',
    description: string,
    excludeUserId?: string,
  ) {
    try {
      await this.notifications.createForSubRole(subRole, description, 'HIGH', {
        excludeUserId,
        href: ORDERS_HREF,
      });
    } catch (err) {
      this.logger.error(
        `No se pudo notificar a ${subRole}: ${(err as Error).message}`,
      );
    }
  }
}
