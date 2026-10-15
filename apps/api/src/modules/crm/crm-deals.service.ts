import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CrmDealSource,
  CrmDealStatus,
  CrmMediaType,
  CrmPriority,
  CrmStageKind,
  OfferStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrmActivitiesService } from './crm-activities.service.js';
import { CrmDealSitesService } from './crm-deal-sites.service.js';
import {
  HOLD_WARNING_DAYS,
  calendarDate,
  isoDay,
} from './crm-ooh.constants.js';
import {
  CrmPipelinesService,
  type CrmPipelineItem,
} from './crm-pipelines.service.js';
import {
  BOARD_CLOSED_WINDOW_DAYS,
  CRM_SUB_ROLE,
  USER_SUMMARY_SELECT,
  type CrmAuthUser,
  type CrmUserSummary,
} from './crm.constants.js';
import type {
  ChangeDealStatusDto,
  CreateDealDto,
  DealBriefDto,
  CreateDealFromOfferDto,
  ListDealsQueryDto,
  MoveDealDto,
  UpdateDealDto,
} from './dto/crm-deal.dto.js';

export interface CrmOfferSummary {
  id: string;
  offerNumber: string;
  status: OfferStatus;
  total: number;
  customerName: string;
  customerCompany: string | null;
  validUntil: string;
  createdAt: string;
  createdByName: string;
  dealId: string | null;
}

export interface CrmDealListItem {
  id: string;
  title: string;
  value: number;
  status: CrmDealStatus;
  priority: CrmPriority;
  source: CrmDealSource | null;
  tags: string[];
  expectedCloseDate: string | null;
  mediaType: CrmMediaType | null;
  brand: string | null;
  industry: string | null;
  campaignStart: string | null;
  campaignEnd: string | null;
  targetZones: string[];
  agencyCommissionPct: number | null;
  renewalOf: string | null;
  siteCount: number;
  heldSiteCount: number;
  /** Earliest live hold expiry, so the card can warn before inventory is lost. */
  nextHoldExpiry: string | null;
  holdExpiringSoon: boolean;
  pipelineId: string;
  stage: {
    id: string;
    name: string;
    color: string | null;
    kind: CrmStageKind;
    probability: number;
  };
  position: number;
  client: { id: string; name: string; company: string | null } | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
  } | null;
  owner: CrmUserSummary;
  offerCount: number;
  openTaskCount: number;
  nextTask: {
    id: string;
    title: string;
    dueAt: string;
    isOverdue: boolean;
  } | null;
  isStale: boolean;
  lastActivityAt: string;
  stageChangedAt: string;
  wonAt: string | null;
  lostAt: string | null;
  createdAt: string;
}

export interface CrmDealDetail extends CrmDealListItem {
  description: string | null;
  lostReason: string | null;
  createdBy: CrmUserSummary | null;
  offers: CrmOfferSummary[];
  updatedAt: string;
}

export interface CrmBoard {
  pipeline: CrmPipelineItem;
  deals: CrmDealListItem[];
}

const DEAL_INCLUDE = {
  stage: {
    select: {
      id: true,
      name: true,
      color: true,
      kind: true,
      probability: true,
      rottingDays: true,
    },
  },
  client: { select: { id: true, name: true, company: true } },
  contact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      whatsapp: true,
    },
  },
  owner: { select: USER_SUMMARY_SELECT },
  _count: { select: { offers: true, tasks: { where: { completedAt: null } } } },
  tasks: {
    where: { completedAt: null },
    orderBy: { dueAt: 'asc' },
    take: 1,
    select: { id: true, title: true, dueAt: true },
  },
  sites: {
    where: { status: { not: 'RELEASED' } },
    select: { status: true, holdUntil: true },
  },
} as const satisfies Prisma.CrmDealInclude;

type DealRow = Prisma.CrmDealGetPayload<{ include: typeof DEAL_INCLUDE }>;

export const OFFER_SUMMARY_SELECT = {
  id: true,
  offerNumber: true,
  status: true,
  totalImpression: true,
  totalRental: true,
  customerName: true,
  customerCompany: true,
  validUntil: true,
  createdAt: true,
  clientId: true,
  createdBy: { select: { firstName: true, lastName: true } },
  crmDealLink: { select: { dealId: true } },
} as const satisfies Prisma.OfferCreatedSelect;

type OfferRow = Prisma.OfferCreatedGetPayload<{
  select: typeof OFFER_SUMMARY_SELECT;
}>;

const DAY_MS = 24 * 60 * 60 * 1000;

export function serializeOffer(row: OfferRow): CrmOfferSummary {
  return {
    id: row.id,
    offerNumber: row.offerNumber,
    status: row.status,
    total: row.totalImpression + row.totalRental,
    customerName: row.customerName,
    customerCompany: row.customerCompany,
    validUntil: row.validUntil.toISOString(),
    createdAt: row.createdAt.toISOString(),
    createdByName: [row.createdBy.firstName, row.createdBy.lastName]
      .filter(Boolean)
      .join(' '),
    dealId: row.crmDealLink?.dealId ?? null,
  };
}

function statusForKind(kind: CrmStageKind): CrmDealStatus {
  return kind === 'WON' ? 'WON' : kind === 'LOST' ? 'LOST' : 'OPEN';
}

function dateOrNull(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  return value ? new Date(value) : null;
}

function calendarOrNull(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  return value ? calendarDate(value) : null;
}

function textOrNull(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

function briefData(dto: DealBriefDto) {
  const start = calendarOrNull(dto.campaignStart);
  const end = calendarOrNull(dto.campaignEnd);
  if (start && end && end < start) {
    throw new BadRequestException(
      'El fin de la campaña debe ser posterior al inicio',
    );
  }
  return {
    ...(dto.mediaType !== undefined ? { mediaType: dto.mediaType } : {}),
    ...(dto.brand !== undefined ? { brand: textOrNull(dto.brand) } : {}),
    ...(dto.industry !== undefined
      ? { industry: textOrNull(dto.industry) }
      : {}),
    ...(start !== undefined ? { campaignStart: start } : {}),
    ...(end !== undefined ? { campaignEnd: end } : {}),
    ...(dto.targetZones !== undefined
      ? {
          targetZones: [
            ...new Set(dto.targetZones.map((z) => z.trim()).filter(Boolean)),
          ],
        }
      : {}),
    ...(dto.agencyCommissionPct !== undefined
      ? { agencyCommissionPct: dto.agencyCommissionPct }
      : {}),
  };
}

@Injectable()
export class CrmDealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelines: CrmPipelinesService,
    private readonly activities: CrmActivitiesService,
    private readonly sites: CrmDealSitesService,
  ) {}

  async board(query: ListDealsQueryDto, user: CrmAuthUser): Promise<CrmBoard> {
    const pipelineId = await this.pipelines.resolvePipelineId(query.pipelineId);
    const pipeline = await this.pipelines.get(pipelineId);
    const closedSince = new Date(
      Date.now() - BOARD_CLOSED_WINDOW_DAYS * DAY_MS,
    );

    const where: Prisma.CrmDealWhereInput = {
      pipelineId,
      ...this.baseFilters(query, user),
      OR: [
        { status: 'OPEN' },
        { status: 'WON', wonAt: { gte: closedSince } },
        { status: 'LOST', lostAt: { gte: closedSince } },
      ],
    };
    const rows = await this.prisma.crmDeal.findMany({
      where,
      include: DEAL_INCLUDE,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
    return { pipeline, deals: rows.map((row) => this.serialize(row)) };
  }

  async list(
    query: ListDealsQueryDto,
    user: CrmAuthUser,
  ): Promise<CrmDealListItem[]> {
    const where: Prisma.CrmDealWhereInput = {
      ...this.baseFilters(query, user),
      ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const rows = await this.prisma.crmDeal.findMany({
      where,
      include: DEAL_INCLUDE,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      take: 200,
    });
    return rows.map((row) => this.serialize(row));
  }

  async get(id: string): Promise<CrmDealDetail> {
    const row = await this.prisma.crmDeal.findUnique({
      where: { id },
      include: {
        ...DEAL_INCLUDE,
        createdBy: { select: USER_SUMMARY_SELECT },
        offers: {
          orderBy: { createdAt: 'desc' },
          include: { offer: { select: OFFER_SUMMARY_SELECT } },
        },
      },
    });
    if (!row) throw new NotFoundException('Negocio no encontrado');
    return {
      ...this.serialize(row),
      description: row.description,
      lostReason: row.lostReason,
      createdBy: row.createdBy,
      offers: row.offers.map((link) => serializeOffer(link.offer)),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async create(dto: CreateDealDto, user: CrmAuthUser): Promise<CrmDealDetail> {
    const stage = await this.resolveStage(dto.pipelineId, dto.stageId);
    const ownerId = await this.resolveOwner(dto.ownerId, user.id);
    const links = await this.resolveLinks(dto.clientId, dto.contactId);
    if (links.clientId && !links.contactId) {
      links.contactId = await this.primaryContactId(links.clientId);
    }
    const status = statusForKind(stage.kind);
    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const deal = await tx.crmDeal.create({
        data: {
          title: dto.title.trim(),
          pipelineId: dto.pipelineId,
          stageId: stage.id,
          clientId: links.clientId,
          contactId: links.contactId,
          ownerId,
          value: dto.value ?? 0,
          expectedCloseDate: dateOrNull(dto.expectedCloseDate) ?? null,
          priority: dto.priority ?? 'MEDIUM',
          source: dto.source ?? null,
          tags: this.cleanTags(dto.tags),
          description: dto.description?.trim() || null,
          ...briefData(dto),
          status,
          wonAt: status === 'WON' ? now : null,
          lostAt: status === 'LOST' ? now : null,
          position: await this.endPosition(stage.id, tx),
          createdById: user.id,
        },
        select: { id: true, clientId: true, contactId: true },
      });
      await this.activities.log(
        {
          type: 'DEAL_CREATED',
          subject: `Negocio creado en "${stage.name}"`,
          dealId: deal.id,
          clientId: deal.clientId,
          contactId: deal.contactId,
          actorId: user.id,
        },
        tx,
      );
      return deal;
    });
    return this.get(created.id);
  }

  async update(
    id: string,
    dto: UpdateDealDto,
    user: CrmAuthUser,
  ): Promise<CrmDealDetail> {
    const existing = await this.findOrThrow(id);
    const data: Prisma.CrmDealUncheckedUpdateInput = { ...briefData(dto) };

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.tags !== undefined) data.tags = this.cleanTags(dto.tags);
    if (dto.description !== undefined)
      data.description = dto.description?.trim() || null;
    if (dto.expectedCloseDate !== undefined) {
      data.expectedCloseDate = dateOrNull(dto.expectedCloseDate);
    }
    if (dto.ownerId !== undefined) {
      data.ownerId = await this.resolveOwner(dto.ownerId, user.id);
    }
    if (dto.clientId !== undefined || dto.contactId !== undefined) {
      const links = await this.resolveLinks(
        dto.clientId === undefined ? existing.clientId : dto.clientId,
        dto.contactId === undefined ? existing.contactId : dto.contactId,
      );
      data.clientId = links.clientId;
      data.contactId = links.contactId;
    }

    await this.prisma.crmDeal.update({ where: { id }, data });
    return this.get(id);
  }

  async move(
    id: string,
    dto: MoveDealDto,
    user: CrmAuthUser,
  ): Promise<CrmDealDetail> {
    const deal = await this.findOrThrow(id);
    const target = await this.prisma.crmStage.findUnique({
      where: { id: dto.stageId },
    });
    if (!target || target.pipelineId !== deal.pipelineId) {
      throw new BadRequestException(
        'La etapa no pertenece al pipeline del negocio',
      );
    }
    await this.transition(
      deal,
      target,
      dto.lostReason,
      user.id,
      dto.beforeDealId,
    );
    return this.get(id);
  }

  async changeStatus(
    id: string,
    dto: ChangeDealStatusDto,
    user: CrmAuthUser,
  ): Promise<CrmDealDetail> {
    const deal = await this.findOrThrow(id);
    const kind: CrmStageKind = dto.status;
    const target = await this.prisma.crmStage.findFirst({
      where: { pipelineId: deal.pipelineId, kind },
      orderBy: { position: kind === 'OPEN' ? 'desc' : 'asc' },
    });
    if (!target)
      throw new BadRequestException('El pipeline no tiene esa etapa');
    await this.transition(deal, target, dto.lostReason, user.id);
    return this.get(id);
  }

  async remove(id: string, user: CrmAuthUser): Promise<{ deleted: true }> {
    const deal = await this.findOrThrow(id);
    const canDelete =
      user.role === 'ADMIN' ||
      deal.ownerId === user.id ||
      deal.createdById === user.id;
    if (!canDelete) {
      throw new ForbiddenException(
        'Solo el responsable del negocio puede eliminarlo',
      );
    }
    await this.prisma.crmDeal.delete({ where: { id } });
    return { deleted: true };
  }

  async linkOffer(
    dealId: string,
    offerId: string,
    user: CrmAuthUser,
  ): Promise<CrmDealDetail> {
    const deal = await this.findOrThrow(dealId);
    const offer = await this.prisma.offerCreated.findUnique({
      where: { id: offerId },
      select: OFFER_SUMMARY_SELECT,
    });
    if (!offer) throw new NotFoundException('Cotización no encontrada');
    if (offer.crmDealLink) {
      throw new ConflictException(
        offer.crmDealLink.dealId === dealId
          ? 'La cotización ya está vinculada a este negocio'
          : 'La cotización ya está vinculada a otro negocio',
      );
    }

    const total = offer.totalImpression + offer.totalRental;
    await this.prisma.$transaction(async (tx) => {
      await tx.crmDealOffer.create({ data: { dealId, offerId } });
      await tx.crmDeal.update({
        where: { id: dealId },
        data: {
          ...(deal.value === 0 ? { value: total } : {}),
          ...(!deal.clientId && offer.clientId
            ? { clientId: offer.clientId }
            : {}),
        },
      });
      await this.activities.log(
        {
          type: 'OFFER_LINKED',
          subject: `Cotización ${offer.offerNumber} vinculada`,
          dealId,
          clientId: deal.clientId ?? offer.clientId,
          actorId: user.id,
          metadata: { offerId, offerNumber: offer.offerNumber, total },
        },
        tx,
      );
    });
    return this.get(dealId);
  }

  async unlinkOffer(dealId: string, offerId: string): Promise<CrmDealDetail> {
    const link = await this.prisma.crmDealOffer.findUnique({
      where: { offerId },
    });
    if (!link || link.dealId !== dealId) {
      throw new NotFoundException(
        'La cotización no está vinculada a este negocio',
      );
    }
    await this.prisma.crmDealOffer.delete({ where: { offerId } });
    return this.get(dealId);
  }

  /** Unlinked offers, the deal's client first, for the "vincular" picker. */
  async availableOffers(
    dealId: string,
    search?: string,
  ): Promise<CrmOfferSummary[]> {
    const deal = await this.findOrThrow(dealId);
    const term = search?.trim();
    const rows = await this.prisma.offerCreated.findMany({
      where: {
        crmDealLink: null,
        ...(term
          ? {
              OR: [
                { offerNumber: { contains: term, mode: 'insensitive' } },
                { customerName: { contains: term, mode: 'insensitive' } },
                { customerCompany: { contains: term, mode: 'insensitive' } },
              ],
            }
          : deal.clientId
            ? { clientId: deal.clientId }
            : {}),
      },
      select: OFFER_SUMMARY_SELECT,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return rows.map(serializeOffer);
  }

  async createFromOffer(
    dto: CreateDealFromOfferDto,
    user: CrmAuthUser,
  ): Promise<CrmDealDetail> {
    const offer = await this.prisma.offerCreated.findUnique({
      where: { id: dto.offerId },
      select: OFFER_SUMMARY_SELECT,
    });
    if (!offer) throw new NotFoundException('Cotización no encontrada');
    if (offer.crmDealLink) {
      throw new ConflictException('La cotización ya tiene un negocio');
    }

    const pipelineId = await this.pipelines.resolvePipelineId(dto.pipelineId);
    const stage = await this.stageForOffer(
      pipelineId,
      offer.status,
      dto.stageId,
    );
    const status = statusForKind(stage.kind);
    const total = offer.totalImpression + offer.totalRental;
    const now = new Date();

    const created = await this.prisma.$transaction(async (tx) => {
      const deal = await tx.crmDeal.create({
        data: {
          title: `${offer.customerCompany || offer.customerName} · ${offer.offerNumber}`,
          pipelineId,
          stageId: stage.id,
          clientId: offer.clientId,
          ownerId: user.id,
          value: total,
          source: 'OFFER',
          status,
          wonAt: status === 'WON' ? now : null,
          lostAt: status === 'LOST' ? now : null,
          lostReason: status === 'LOST' ? 'Cotización rechazada' : null,
          expectedCloseDate: status === 'OPEN' ? offer.validUntil : null,
          position: await this.endPosition(stage.id, tx),
          createdById: user.id,
          offers: { create: { offerId: offer.id } },
        },
        select: { id: true },
      });
      await this.activities.log(
        {
          type: 'DEAL_CREATED',
          subject: `Negocio creado desde la cotización ${offer.offerNumber}`,
          dealId: deal.id,
          clientId: offer.clientId,
          actorId: user.id,
          metadata: { offerId: offer.id, offerNumber: offer.offerNumber },
        },
        tx,
      );
      return deal;
    });
    return this.get(created.id);
  }

  private async transition(
    deal: {
      id: string;
      stageId: string;
      clientId: string | null;
      contactId: string | null;
    },
    target: { id: string; name: string; kind: CrmStageKind },
    lostReason: string | undefined,
    actorId: string,
    beforeDealId?: string | null,
  ) {
    const fromStage = await this.prisma.crmStage.findUnique({
      where: { id: deal.stageId },
      select: { name: true, kind: true },
    });
    const stageChanged = deal.stageId !== target.id;
    const status = statusForKind(target.kind);
    if (stageChanged && status === 'LOST' && !lostReason?.trim()) {
      throw new BadRequestException(
        'Indica el motivo por el que se perdió el negocio',
      );
    }
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      const position = await this.positionFor(
        target.id,
        deal.id,
        beforeDealId,
        tx,
      );
      const data: Prisma.CrmDealUncheckedUpdateInput = {
        stageId: target.id,
        position,
      };
      if (stageChanged) {
        data.stageChangedAt = now;
        data.status = status;
        data.wonAt = status === 'WON' ? now : null;
        data.lostAt = status === 'LOST' ? now : null;
        data.lostReason = status === 'LOST' ? lostReason!.trim() : null;
      }
      await tx.crmDeal.update({ where: { id: deal.id }, data });

      if (!stageChanged) return;
      if (status !== statusForKind(fromStage?.kind ?? 'OPEN')) {
        await this.sites.syncWithDealStatus(deal.id, status, tx);
      }
      const wasClosed = fromStage && fromStage.kind !== 'OPEN';
      const type =
        status === 'WON'
          ? 'DEAL_WON'
          : status === 'LOST'
            ? 'DEAL_LOST'
            : wasClosed
              ? 'DEAL_REOPENED'
              : 'STAGE_CHANGED';
      await this.activities.log(
        {
          type,
          subject: `${fromStage?.name ?? '—'} → ${target.name}`,
          body: status === 'LOST' ? lostReason!.trim() : null,
          dealId: deal.id,
          clientId: deal.clientId,
          contactId: deal.contactId,
          actorId,
          metadata: { fromStageId: deal.stageId, toStageId: target.id },
        },
        tx,
      );
    });
  }

  private async positionFor(
    stageId: string,
    dealId: string,
    beforeDealId: string | null | undefined,
    db: Prisma.TransactionClient,
  ): Promise<number> {
    if (!beforeDealId || beforeDealId === dealId)
      return this.endPosition(stageId, db, dealId);
    const before = await db.crmDeal.findUnique({
      where: { id: beforeDealId },
      select: { stageId: true, position: true },
    });
    if (!before || before.stageId !== stageId)
      return this.endPosition(stageId, db, dealId);
    const previous = await db.crmDeal.findFirst({
      where: {
        stageId,
        id: { not: dealId },
        position: { lt: before.position },
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return previous
      ? (previous.position + before.position) / 2
      : before.position - 1;
  }

  private async endPosition(
    stageId: string,
    db: Prisma.TransactionClient | PrismaService,
    excludeId?: string,
  ): Promise<number> {
    const last = await db.crmDeal.findFirst({
      where: { stageId, ...(excludeId ? { id: { not: excludeId } } : {}) },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? 0) + 1;
  }

  private async stageForOffer(
    pipelineId: string,
    status: OfferStatus,
    stageId?: string,
  ) {
    if (status === 'ACCEPTED' || status === 'DECLINED') {
      const kind: CrmStageKind = status === 'ACCEPTED' ? 'WON' : 'LOST';
      const stage = await this.prisma.crmStage.findFirst({
        where: { pipelineId, kind },
      });
      if (stage) return stage;
    }
    if (stageId) return this.resolveStage(pipelineId, stageId);
    const open = await this.prisma.crmStage.findMany({
      where: { pipelineId, kind: 'OPEN' },
      orderBy: { position: 'asc' },
    });
    const proposal = open.find((s) => s.probability >= 50) ?? open[0];
    if (!proposal)
      throw new BadRequestException('El pipeline no tiene etapas abiertas');
    return proposal;
  }

  private async resolveStage(pipelineId: string, stageId?: string) {
    if (stageId) {
      const stage = await this.prisma.crmStage.findUnique({
        where: { id: stageId },
      });
      if (!stage || stage.pipelineId !== pipelineId) {
        throw new BadRequestException('La etapa no pertenece al pipeline');
      }
      return stage;
    }
    const first = await this.prisma.crmStage.findFirst({
      where: { pipelineId, kind: 'OPEN' },
      orderBy: { position: 'asc' },
    });
    if (!first)
      throw new BadRequestException('El pipeline no tiene etapas abiertas');
    return first;
  }

  private async resolveOwner(
    ownerId: string | undefined,
    fallback: string,
  ): Promise<string> {
    if (!ownerId || ownerId === 'me' || ownerId === fallback) return fallback;
    const owner = await this.prisma.user.findFirst({
      where: { id: ownerId, disabled: false, subRoles: { has: CRM_SUB_ROLE } },
      select: { id: true },
    });
    if (!owner) {
      throw new BadRequestException(
        'El responsable debe ser un usuario activo de Ventas',
      );
    }
    return owner.id;
  }

  private async resolveLinks(
    clientId: string | null | undefined,
    contactId: string | null | undefined,
  ): Promise<{ clientId: string | null; contactId: string | null }> {
    let resolvedClient = clientId ?? null;
    if (resolvedClient) {
      const exists = await this.prisma.client.count({
        where: { id: resolvedClient },
      });
      if (!exists) throw new BadRequestException('Cliente no encontrado');
    }
    if (contactId) {
      const contact = await this.prisma.crmContact.findUnique({
        where: { id: contactId },
        select: { clientId: true },
      });
      if (!contact) throw new BadRequestException('Contacto no encontrado');
      if (
        resolvedClient &&
        contact.clientId &&
        contact.clientId !== resolvedClient
      ) {
        throw new BadRequestException('El contacto pertenece a otro cliente');
      }
      resolvedClient ??= contact.clientId;
    }
    return { clientId: resolvedClient, contactId: contactId ?? null };
  }

  private async primaryContactId(clientId: string): Promise<string | null> {
    const contact = await this.prisma.crmContact.findFirst({
      where: { clientId, isPrimary: true },
      select: { id: true },
    });
    return contact?.id ?? null;
  }

  private baseFilters(
    query: ListDealsQueryDto,
    user: CrmAuthUser,
  ): Prisma.CrmDealWhereInput {
    const where: Prisma.CrmDealWhereInput = {};
    if (query.ownerId)
      where.ownerId = query.ownerId === 'me' ? user.id : query.ownerId;
    if (query.mediaType) where.mediaType = query.mediaType;
    if (query.clientId) where.clientId = query.clientId;
    if (query.contactId) where.contactId = query.contactId;
    const term = query.search?.trim();
    if (term) {
      where.AND = [
        {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { client: { name: { contains: term, mode: 'insensitive' } } },
            { client: { company: { contains: term, mode: 'insensitive' } } },
            { contact: { firstName: { contains: term, mode: 'insensitive' } } },
            { brand: { contains: term, mode: 'insensitive' } },
            { tags: { has: term } },
          ],
        },
      ];
    }
    return where;
  }

  private cleanTags(tags: string[] | undefined): string[] {
    return [...new Set((tags ?? []).map((t) => t.trim()).filter(Boolean))];
  }

  private async findOrThrow(id: string) {
    const deal = await this.prisma.crmDeal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException('Negocio no encontrado');
    return deal;
  }

  private serialize(row: DealRow): CrmDealListItem {
    const rotting = row.stage.rottingDays;
    const isStale =
      row.status === 'OPEN' &&
      rotting != null &&
      Date.now() - row.lastActivityAt.getTime() > rotting * DAY_MS;
    const next = row.tasks[0];
    const now = Date.now();
    const liveHolds = row.sites.filter(
      (s) => s.status === 'HELD' && s.holdUntil && s.holdUntil.getTime() > now,
    );
    const nextHoldExpiry = liveHolds.reduce<Date | null>(
      (min, s) => (!min || s.holdUntil! < min ? s.holdUntil : min),
      null,
    );
    return {
      id: row.id,
      title: row.title,
      value: row.value,
      status: row.status,
      priority: row.priority,
      source: row.source,
      tags: row.tags,
      expectedCloseDate: row.expectedCloseDate?.toISOString() ?? null,
      mediaType: row.mediaType,
      brand: row.brand,
      industry: row.industry,
      campaignStart: isoDay(row.campaignStart),
      campaignEnd: isoDay(row.campaignEnd),
      targetZones: row.targetZones,
      agencyCommissionPct: row.agencyCommissionPct,
      renewalOf: row.renewalOf,
      siteCount: row.sites.length,
      heldSiteCount: liveHolds.length,
      nextHoldExpiry: nextHoldExpiry?.toISOString() ?? null,
      holdExpiringSoon:
        !!nextHoldExpiry &&
        nextHoldExpiry.getTime() - now < HOLD_WARNING_DAYS * DAY_MS,
      pipelineId: row.pipelineId,
      stage: {
        id: row.stage.id,
        name: row.stage.name,
        color: row.stage.color,
        kind: row.stage.kind,
        probability: row.stage.probability,
      },
      position: row.position,
      client: row.client,
      contact: row.contact,
      owner: row.owner,
      offerCount: row._count.offers,
      openTaskCount: row._count.tasks,
      nextTask: next
        ? {
            id: next.id,
            title: next.title,
            dueAt: next.dueAt.toISOString(),
            isOverdue: next.dueAt.getTime() < Date.now(),
          }
        : null,
      isStale,
      lastActivityAt: row.lastActivityAt.toISOString(),
      stageChangedAt: row.stageChangedAt.toISOString(),
      wonAt: row.wonAt?.toISOString() ?? null,
      lostAt: row.lostAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
