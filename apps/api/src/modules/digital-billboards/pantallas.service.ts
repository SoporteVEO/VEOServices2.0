import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DigitalBillboardLogType,
  DigitalCampaignArt,
  DigitalCampaignDeal,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { DigitalBillboardsService } from './digital-billboards.service.js';
import type {
  CampaignInputDto,
  CreateScreenDto,
  CreateSublistDto,
  DeleteCampaignsDto,
  IngestOrderDto,
  ListLogsQueryDto,
  MoveCampaignDto,
  SetCampaignPauseDto,
  UpdateCampaignDto,
  UpdatePantallasSettingsDto,
  UpdateScreenDto,
  UpdateSublistDto,
} from './dto/pantallas.dto.js';
import {
  REPORT_LOG_TYPES,
  touchScreen,
  writeLogs,
  type PantallasActor,
  type PantallasLogEntry,
} from './pantallas-log.js';
import {
  campaignDataFromDto,
  campaignDataFromRow,
  campaignInclude,
  campaignWriteData,
  mapCampaign,
  versionsCreateData,
  type CampaignData,
} from './pantallas-mappers.js';
import {
  PantallasPlacementService,
  extraSublistName,
  screenCodeOf,
  type PantallasSettings,
  type PlacementResult,
} from './pantallas-placement.service.js';
import {
  FULL_SUBLIST_SPOTS,
  logTypeForEndDateChange,
  toIsoDate,
  todayIso,
} from './pantallas-rules.js';

const BUSINESS_UTC_OFFSET = '-06:00';

@Injectable()
export class PantallasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billboards: DigitalBillboardsService,
    private readonly placement: PantallasPlacementService,
  ) {}

  async getBoard() {
    const [settings, screens] = await Promise.all([
      this.placement.loadSettings(this.prisma),
      this.prisma.digitalBillboard.findMany({
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        include: {
          image: true,
          sublists: {
            orderBy: { position: 'asc' },
            include: {
              campaigns: {
                include: campaignInclude,
                orderBy: { createdAt: 'asc' },
              },
            },
          },
        },
      }),
    ]);

    return {
      settings,
      screens: screens.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        price: s.price,
        maxSpots: s.maxSpots,
        turnOnAt: s.turnOnAt,
        turnOffAt: s.turnOffAt,
        position: s.position,
        aliases: s.aliases,
        imageThumbnailUrl: s.image?.thumbnailUrl ?? s.image?.completeUrl ?? null,
        lastChange: s.lastChangeClient
          ? {
              client: s.lastChangeClient,
              action: s.lastChangeAction ?? '',
              at: s.lastChangeAt?.toISOString() ?? null,
            }
          : null,
        sublists: s.sublists.map((sub) => ({
          id: sub.id,
          name: sub.name,
          capacity: sub.capacity,
          position: sub.position,
          campaigns: sub.campaigns.map(mapCampaign),
        })),
      })),
    };
  }

  async listLogs(query: ListLogsQueryDto) {
    const rows = await this.prisma.digitalBillboardLog.findMany({
      where: {
        type: { in: REPORT_LOG_TYPES },
        createdAt: {
          ...(query.from
            ? { gte: new Date(`${query.from}T00:00:00${BUSINESS_UTC_OFFSET}`) }
            : {}),
          ...(query.to
            ? { lte: new Date(`${query.to}T23:59:59.999${BUSINESS_UTC_OFFSET}`) }
            : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      client: r.client,
      campaign: r.campaign,
      screenName: r.screenName,
      sublistName: r.sublistName,
      spotsPerDay: r.spotsPerDay,
      startDate: toIsoDate(r.startDate),
      endDate: toIsoDate(r.endDate),
      previousEndDate: toIsoDate(r.previousEndDate),
      previousSpotsPerDay: r.previousSpotsPerDay,
      detail: r.detail,
      orderGroupId: r.orderGroupId,
      newSublist: r.newSublist,
      actorName: r.actorName,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async clearLogs() {
    const { count } = await this.prisma.digitalBillboardLog.deleteMany({});
    return { deleted: count };
  }

  async updateSettings(dto: UpdatePantallasSettingsDto) {
    const row = await this.prisma.digitalBillboardSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...dto },
      update: dto,
    });
    return { spotsPerHour: row.spotsPerHour, minHours: row.minHours };
  }

  async createScreen(dto: CreateScreenDto) {
    const screen = await this.billboards.create(dto);
    await this.prisma.digitalBillboardSublist.create({
      data: {
        digitalBillboardId: screen.id,
        name: `${screenCodeOf(screen)} 01`,
        capacity: FULL_SUBLIST_SPOTS,
      },
    });
    return { id: screen.id };
  }

  async updateScreen(id: string, dto: UpdateScreenDto) {
    const screen = await this.billboards.update(id, dto);
    return { id: screen.id };
  }

  async createSublist(screenId: string, dto: CreateSublistDto) {
    const screen = await this.prisma.digitalBillboard.findUnique({
      where: { id: screenId },
      select: {
        id: true,
        code: true,
        name: true,
        sublists: { select: { position: true } },
      },
    });
    if (!screen) throw new NotFoundException('Pantalla no encontrada');

    const sublist = await this.prisma.digitalBillboardSublist.create({
      data: {
        digitalBillboardId: screen.id,
        name: dto.name?.trim() || extraSublistName(screen, dto.capacity),
        capacity: dto.capacity,
        position: screen.sublists.reduce(
          (max, s) => Math.max(max, s.position + 1),
          0,
        ),
      },
    });
    return { id: sublist.id };
  }

  async updateSublist(id: string, dto: UpdateSublistDto) {
    await this.findSublist(id);
    await this.prisma.digitalBillboardSublist.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.capacity ? { capacity: dto.capacity } : {}),
      },
    });
    return { id };
  }

  async deleteSublist(id: string) {
    await this.findSublist(id);
    await this.prisma.digitalBillboardSublist.delete({ where: { id } });
    return { deleted: true };
  }

  async createCampaign(
    sublistId: string,
    dto: CampaignInputDto,
    actor: PantallasActor,
  ) {
    const data = campaignDataFromDto(dto);
    return this.prisma.$transaction(async (tx) => {
      const sublist = await tx.digitalBillboardSublist.findUnique({
        where: { id: sublistId },
        include: { digitalBillboard: { select: { id: true, name: true } } },
      });
      if (!sublist) throw new NotFoundException('Sublista no encontrada');
      const screen = sublist.digitalBillboard;

      const campaign = await tx.digitalBillboardCampaign.create({
        data: {
          ...campaignWriteData(data),
          sublistId,
          versions: { create: versionsCreateData(data.versions) },
        },
      });
      await touchScreen(tx, screen.id, data.client, 'agregada');
      await writeLogs(
        tx,
        [
          {
            type: DigitalBillboardLogType.NEW,
            client: data.client,
            campaign: data.campaign,
            screenName: screen.name,
            sublistName: sublist.name,
            spotsPerDay: data.spotsPerDay,
            startDate: data.startDate,
            endDate: data.endDate,
          },
        ],
        actor,
      );

      const copies = await this.placeCopies(
        tx,
        data,
        dto.alsoScreenIds,
        screen.id,
        dto.refDate,
        actor,
      );
      return { id: campaign.id, copies };
    });
  }

  async updateCampaign(
    id: string,
    dto: UpdateCampaignDto,
    actor: PantallasActor,
  ) {
    const data = campaignDataFromDto(dto);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.digitalBillboardCampaign.findUnique({
        where: { id },
        include: {
          ...campaignInclude,
          sublist: {
            include: { digitalBillboard: { select: { id: true, name: true } } },
          },
        },
      });
      if (!existing) throw new NotFoundException('Campaña no encontrada');
      const screen = existing.sublist.digitalBillboard;
      const before = campaignDataFromRow(existing);

      let target = existing.sublist;
      if (dto.sublistId && dto.sublistId !== existing.sublistId) {
        const next = await tx.digitalBillboardSublist.findUnique({
          where: { id: dto.sublistId },
          include: {
            digitalBillboard: { select: { id: true, name: true } },
          },
        });
        if (!next || next.digitalBillboardId !== screen.id) {
          throw new BadRequestException(
            'La sublista destino no pertenece a esta pantalla',
          );
        }
        target = next;
      }

      await tx.digitalBillboardCampaignVersion.deleteMany({
        where: { campaignId: id },
      });
      await tx.digitalBillboardCampaign.update({
        where: { id },
        data: {
          ...campaignWriteData(data),
          sublistId: target.id,
          versions: { create: versionsCreateData(data.versions) },
        },
      });
      await touchScreen(tx, screen.id, data.client, 'modificada');

      const dateLog = logTypeForEndDateChange(
        before.endDate,
        data.endDate,
        todayIso(),
      );
      const logs: PantallasLogEntry[] = [
        {
          type: dateLog ?? DigitalBillboardLogType.EDITED,
          client: data.client,
          campaign: data.campaign,
          screenName: screen.name,
          sublistName: existing.sublist.name,
          spotsPerDay: data.spotsPerDay,
          startDate: data.startDate,
          endDate: data.endDate,
          previousEndDate: before.endDate,
          previousSpotsPerDay: before.spotsPerDay,
        },
      ];
      if (target.id !== existing.sublistId) {
        await touchScreen(tx, screen.id, data.client, 'movida');
        logs.push({
          ...logs[0],
          type: DigitalBillboardLogType.MOVED,
          sublistName: target.name,
          detail: `desde ${existing.sublist.name}`,
        });
      }
      await writeLogs(tx, logs, actor);

      const copies = await this.placeCopies(
        tx,
        data,
        dto.alsoScreenIds,
        screen.id,
        dto.refDate,
        actor,
      );
      return { id, copies };
    });
  }

  async setPause(id: string, dto: SetCampaignPauseDto, actor: PantallasActor) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.findCampaignWithScreen(tx, id);
      const reason = dto.paused ? dto.reason?.trim() || null : null;
      await tx.digitalBillboardCampaign.update({
        where: { id },
        data: { paused: dto.paused, pauseReason: reason },
      });
      const screen = existing.sublist.digitalBillboard;
      await touchScreen(
        tx,
        screen.id,
        existing.client,
        dto.paused ? 'pausada' : 'reanudada',
      );
      await writeLogs(
        tx,
        [
          {
            type: dto.paused
              ? DigitalBillboardLogType.PAUSED
              : DigitalBillboardLogType.RESUMED,
            client: existing.client,
            campaign: existing.campaign,
            screenName: screen.name,
            sublistName: existing.sublist.name,
            spotsPerDay: existing.spotsPerDay,
            startDate: toIsoDate(existing.startDate),
            endDate: toIsoDate(existing.endDate),
            detail: reason,
          },
        ],
        actor,
      );
      return { id };
    });
  }

  async moveCampaign(id: string, dto: MoveCampaignDto, actor: PantallasActor) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await this.findCampaignWithScreen(tx, id);
      if (existing.sublistId === dto.sublistId) return { id };
      const target = await tx.digitalBillboardSublist.findUnique({
        where: { id: dto.sublistId },
        include: { digitalBillboard: { select: { id: true, name: true } } },
      });
      if (!target) throw new NotFoundException('Sublista no encontrada');

      await tx.digitalBillboardCampaign.update({
        where: { id },
        data: { sublistId: target.id },
      });
      await touchScreen(tx, target.digitalBillboard.id, existing.client, 'movida');
      await writeLogs(
        tx,
        [
          {
            type: DigitalBillboardLogType.MOVED,
            client: existing.client,
            campaign: existing.campaign,
            screenName: target.digitalBillboard.name,
            sublistName: target.name,
            spotsPerDay: existing.spotsPerDay,
            startDate: toIsoDate(existing.startDate),
            endDate: toIsoDate(existing.endDate),
            detail: `desde ${existing.sublist.name}`,
          },
        ],
        actor,
      );
      return { id };
    });
  }

  async deleteCampaigns(dto: DeleteCampaignsDto, actor: PantallasActor) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.digitalBillboardCampaign.findMany({
        where: { id: { in: dto.ids } },
        include: {
          sublist: {
            include: { digitalBillboard: { select: { id: true, name: true } } },
          },
        },
      });
      if (rows.length === 0) return { deleted: 0 };

      await tx.digitalBillboardCampaign.deleteMany({
        where: { id: { in: rows.map((r) => r.id) } },
      });
      for (const row of rows) {
        await touchScreen(
          tx,
          row.sublist.digitalBillboard.id,
          row.client,
          'eliminada',
        );
      }
      await writeLogs(
        tx,
        rows.map((row) => ({
          type: DigitalBillboardLogType.REMOVED,
          client: row.client,
          campaign: row.campaign,
          screenName: row.sublist.digitalBillboard.name,
          sublistName: row.sublist.name,
          spotsPerDay: row.spotsPerDay,
          startDate: toIsoDate(row.startDate),
          endDate: toIsoDate(row.endDate),
        })),
        actor,
      );
      return { deleted: rows.length };
    });
  }

  /** "Ingresar OP": the same campaign across several screens, each with its own frequency and values. */
  async ingestOrder(dto: IngestOrderDto, actor: PantallasActor) {
    const orderGroupId = randomUUID();
    const results = await this.prisma.$transaction((tx) =>
      this.placeOrder(tx, dto, orderGroupId, actor),
    );
    return { orderGroupId, results };
  }

  async placeOrder(
    tx: Prisma.TransactionClient,
    dto: IngestOrderDto,
    orderGroupId: string,
    actor: PantallasActor,
  ): Promise<PlacementResult[]> {
    const refIso = dto.refDate ?? todayIso();
    const seen = new Set<string>();
    const rows = dto.screens.filter((s) =>
      seen.has(s.screenId) ? false : (seen.add(s.screenId), true),
    );

    const settings = await this.placement.loadSettings(tx);
    const out: PlacementResult[] = [];
    for (const row of rows) {
      const data: CampaignData = {
        client: dto.client.trim(),
        campaign: dto.campaign?.trim() ?? '',
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        spotsPerDay: row.spotsPerDay,
        notes: dto.notes?.trim() || null,
        paused: false,
        pauseReason: null,
        art: dto.art ?? DigitalCampaignArt.RECEIVED,
        deal: row.deal ?? DigitalCampaignDeal.COMMERCIAL,
        monthlyValue: row.monthlyValue ?? null,
        spotValue: row.spotValue ?? null,
        totalValue: null,
        versions: [],
      };
      out.push(
        await this.placement.place(
          tx,
          { screenId: row.screenId, data, refIso, orderGroupId },
          settings,
          actor,
        ),
      );
    }
    return out;
  }

  private async placeCopies(
    tx: Prisma.TransactionClient,
    data: CampaignData,
    screenIds: string[] | undefined,
    excludeScreenId: string,
    refDate: string | undefined,
    actor: PantallasActor,
  ): Promise<PlacementResult[]> {
    const targets = [...new Set(screenIds ?? [])].filter(
      (screenId) => screenId !== excludeScreenId,
    );
    if (targets.length === 0) return [];

    const settings: PantallasSettings = await this.placement.loadSettings(tx);
    const refIso = refDate ?? todayIso();
    const results: PlacementResult[] = [];
    for (const screenId of targets) {
      results.push(
        await this.placement.place(
          tx,
          { screenId, data, refIso },
          settings,
          actor,
        ),
      );
    }
    return results;
  }

  private async findSublist(id: string) {
    const sublist = await this.prisma.digitalBillboardSublist.findUnique({
      where: { id },
    });
    if (!sublist) throw new NotFoundException('Sublista no encontrada');
    return sublist;
  }

  private async findCampaignWithScreen(
    tx: Prisma.TransactionClient,
    id: string,
  ) {
    const campaign = await tx.digitalBillboardCampaign.findUnique({
      where: { id },
      include: {
        sublist: {
          include: { digitalBillboard: { select: { id: true, name: true } } },
        },
      },
    });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return campaign;
  }
}
