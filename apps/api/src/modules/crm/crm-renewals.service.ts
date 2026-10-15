import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CrmDealStatus, CrmSiteKind, Prisma } from '@prisma/client';
import { TtlCache } from '../../lib/ttl-cache.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { inferMediaType } from './crm-deal-sites.service.js';
import { CrmDealsService, type CrmDealDetail } from './crm-deals.service.js';
import {
  CrmInventoryService,
  siteKey,
  type SiteRef,
} from './crm-inventory.service.js';
import { CrmPipelinesService } from './crm-pipelines.service.js';
import { fullName, type CrmAuthUser } from './crm.constants.js';
import {
  RENEWAL_DEFAULT_WINDOW_DAYS,
  addDays,
  flightDays,
  isoDay,
  normalizeText,
  siteTotal,
} from './crm-ooh.constants.js';
import type {
  CreateRenewalDealDto,
  ListRenewalsQueryDto,
} from './dto/crm-renewal.dto.js';

export interface CrmRenewalItem {
  key: string;
  kind: CrmSiteKind;
  reference: string;
  description: string | null;
  brand: string | null;
  customerName: string;
  agencyName: string | null;
  executiveName: string | null;
  startDate: string;
  endDate: string;
  daysLeft: number;
  siteCount: number;
  spotsPerDay: number | null;
  value: number | null;
  client: { id: string; name: string; company: string | null } | null;
  deal: {
    id: string;
    title: string;
    status: CrmDealStatus;
    stageName: string;
    ownerName: string;
  } | null;
  isMine: boolean;
}

export interface CrmRenewals {
  from: string;
  to: string;
  items: CrmRenewalItem[];
  summary: {
    total: number;
    unmanaged: number;
    inProgress: number;
    won: number;
    lost: number;
    endingIn30: number;
  };
}

interface StaticContractRow {
  mconId: number;
  mconCodigo: string;
  mconAtencionA: string | null;
  mconMarca: string | null;
  cliNombres: string | null;
  cliEmail: string | null;
  cliEmailFacturacion: string | null;
  executiveName: string | null;
  agencyName: string | null;
  earliestStart: Date;
  latestEnd: Date;
  totalFaces: number;
}

const ENDING_CONTRACTS_SQL = `
SELECT TOP (500)
    maecon.mconId,
    MAX(maecon.mconCodigo) AS mconCodigo,
    MAX(maecon.mconAtencionA) AS mconAtencionA,
    MAX(maecon.mconMarca) AS mconMarca,
    MAX(cli.cliNombres) AS cliNombres,
    MAX(cli.cliEmail) AS cliEmail,
    MAX(cli.cliEmailFacturacion) AS cliEmailFacturacion,
    MAX(ej.ejecNombre) AS executiveName,
    MAX(agen.agenNombre) AS agencyName,
    MIN(detcon.dconFechaDesde) AS earliestStart,
    MAX(detcon.dconFechaHasta) AS latestEnd,
    COUNT(DISTINCT detcon.caraId) AS totalFaces
FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
INNER JOIN olVallas.dbo.detContratos detcon WITH (NOLOCK)
    ON detcon.mconId = maecon.mconId
INNER JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON maecon.cliId = cli.cliId
LEFT JOIN olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
    ON ej.ejecId = maecon.ejecId
LEFT JOIN olVallas.dbo.Agencias agen WITH (NOLOCK)
    ON agen.agenId = maecon.agenId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND NOT EXISTS (
      SELECT 1
      FROM olVallas.dbo.maeContratos child WITH (NOLOCK)
      WHERE child.mconIdPadre = maecon.mconId
        AND child.mconAnulado <> 1
        AND child.mconPosteado <> 0
  )
GROUP BY maecon.mconId
HAVING MAX(detcon.dconFechaHasta) >= @FechaDesde
   AND MAX(detcon.dconFechaHasta) <= @FechaHasta
ORDER BY MAX(detcon.dconFechaHasta) ASC
`;

const CONTRACT_FACES_SQL = `
SELECT DISTINCT detcon.caraId
FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
WHERE detcon.mconId = @MconId
`;

interface RenewalSource {
  reference: string;
  brand: string | null;
  customerName: string;
  description: string | null;
  clientId: string | null;
  startDate: Date;
  endDate: Date;
  sites: (SiteRef & { spotsPerDay: number | null })[];
}

interface RenewalDealRow {
  id: string;
  title: string;
  status: CrmDealStatus;
  renewalOf: string | null;
  ownerId: string;
  stage: { name: string };
  owner: { firstName: string; lastName: string | null };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RENEWABLE_DEALS = ['COMMERCIAL', 'EXCHANGE'] as const;
const MAX_RENEWAL_DAYS = 365;
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class CrmRenewalsService {
  private readonly contractsCache = new TtlCache<StaticContractRow[]>(
    CACHE_TTL_MS,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
    private readonly deals: CrmDealsService,
    private readonly pipelines: CrmPipelinesService,
    private readonly inventory: CrmInventoryService,
  ) {}

  async list(
    query: ListRenewalsQueryDto,
    user: CrmAuthUser,
  ): Promise<CrmRenewals> {
    const days = Math.min(
      Math.max(Number(query.days) || RENEWAL_DEFAULT_WINDOW_DAYS, 7),
      365,
    );
    const today = startOfTodayUtc();
    const from = addDays(today, -Number(query.pastDays ?? 0));
    const to = addDays(today, days);

    const [staticItems, digitalItems, me] = await Promise.all([
      query.kind === 'DIGITAL' ? [] : this.staticRenewals(from, to),
      query.kind === 'STATIC' ? [] : this.digitalRenewals(from, to, user.id),
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true },
      }),
    ]);

    let items = [...staticItems, ...digitalItems];
    const deals = await this.renewalDeals(items.map((i) => i.key));
    const tokens = nameTokens(me);
    items = items.map((item) => {
      const deal = deals.get(item.key) ?? null;
      const ownedByMe = deal?.ownerId === user.id;
      const execMatch =
        item.kind === 'STATIC' &&
        tokens.length > 0 &&
        tokens.every((t) => normalizeText(item.executiveName).includes(t));
      return {
        ...item,
        deal: deal
          ? {
              id: deal.id,
              title: deal.title,
              status: deal.status,
              stageName: deal.stage.name,
              ownerName: fullName(deal.owner),
            }
          : null,
        isMine: ownedByMe || execMatch || item.isMine,
      };
    });

    if (query.scope === 'mine') items = items.filter((i) => i.isMine);
    const term = normalizeText(query.search);
    if (term) {
      items = items.filter((i) =>
        [
          i.reference,
          i.customerName,
          i.brand,
          i.description,
          i.client?.name,
          i.client?.company,
        ].some((v) => normalizeText(v).includes(term)),
      );
    }
    items.sort((a, b) => a.endDate.localeCompare(b.endDate));

    return {
      from: isoDay(from)!,
      to: isoDay(to)!,
      items,
      summary: {
        total: items.length,
        unmanaged: items.filter((i) => !i.deal).length,
        inProgress: items.filter((i) => i.deal?.status === 'OPEN').length,
        won: items.filter((i) => i.deal?.status === 'WON').length,
        lost: items.filter((i) => i.deal?.status === 'LOST').length,
        endingIn30: items.filter((i) => i.daysLeft <= 30).length,
      },
    };
  }

  async createDeal(
    dto: CreateRenewalDealDto,
    user: CrmAuthUser,
  ): Promise<CrmDealDetail> {
    const existing = await this.prisma.crmDeal.findFirst({
      where: { renewalOf: dto.key, status: { in: ['OPEN', 'WON'] } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Ya existe un negocio de renovación para este contrato',
      );
    }

    const source: RenewalSource | null = dto.key.startsWith('STATIC:')
      ? await this.staticSource(dto.key)
      : dto.key.startsWith('DIGITAL:')
        ? await this.digitalSource(dto.key)
        : null;
    if (!source) throw new BadRequestException('Contrato no válido');

    const duration = Math.min(
      flightDays(source.startDate, source.endDate),
      MAX_RENEWAL_DAYS,
    );
    const start = addDays(source.endDate, 1);
    const end = addDays(start, duration - 1);
    const snapshot = await this.inventory.resolve(source.sites, start, end);
    const sites = source.sites
      .map((ref) => ({ ref, item: snapshot.get(siteKey(ref)) }))
      .filter((s) => !!s.item);
    const value = sites.reduce(
      (sum, s) => sum + siteTotal(s.item!.rate, start, end),
      0,
    );
    const daysLeft = Math.round(
      (source.endDate.getTime() - startOfTodayUtc().getTime()) / DAY_MS,
    );
    const pipelineId = await this.pipelines.resolvePipelineId(dto.pipelineId);

    const deal = await this.deals.create(
      {
        title:
          `Renovación · ${source.brand || source.customerName} · ${source.reference}`.slice(
            0,
            160,
          ),
        pipelineId,
        clientId: source.clientId,
        value: Math.round(value * 100) / 100,
        source: 'RENEWAL',
        priority: daysLeft <= 30 ? 'HIGH' : 'MEDIUM',
        expectedCloseDate: isoDay(source.endDate),
        mediaType: sites.length
          ? inferMediaType(sites.map((s) => s.item!.kind))
          : null,
        brand: source.brand,
        campaignStart: isoDay(start),
        campaignEnd: isoDay(end),
        description: source.description,
      },
      user,
    );

    await this.prisma.$transaction([
      this.prisma.crmDeal.update({
        where: { id: deal.id },
        data: { renewalOf: dto.key },
      }),
      this.prisma.crmDealSite.createMany({
        data: sites.map(
          ({ ref, item }): Prisma.CrmDealSiteCreateManyInput => ({
            dealId: deal.id,
            kind: item!.kind,
            billboardId: item!.billboardId,
            digitalBillboardId: item!.digitalBillboardId,
            code: item!.code,
            label: item!.label,
            cityName: item!.cityName,
            departmentName: item!.departmentName,
            latitude: item!.latitude,
            longitude: item!.longitude,
            width: item!.width,
            height: item!.height,
            startDate: start,
            endDate: end,
            spotsPerDay:
              item!.kind === 'DIGITAL' ? (ref.spotsPerDay ?? 30) : null,
            rate: item!.rate,
            createdById: user.id,
          }),
        ),
      }),
    ]);
    return this.deals.get(deal.id);
  }

  private async staticRenewals(
    from: Date,
    to: Date,
  ): Promise<CrmRenewalItem[]> {
    const key = `${isoDay(from)}|${isoDay(to)}`;
    const rows = await this.contractsCache.getOrFetch(key, () =>
      this.brilo.query<StaticContractRow>(ENDING_CONTRACTS_SQL, {
        FechaDesde: from,
        FechaHasta: to,
      }),
    );
    const clients = await this.clientsByEmail(
      rows.flatMap((r) => [r.cliEmail, r.cliEmailFacturacion]),
    );
    const today = startOfTodayUtc();
    return rows.map((row) => {
      const email = normalizeText(row.cliEmail);
      const billing = normalizeText(row.cliEmailFacturacion);
      return {
        key: `STATIC:${row.mconId}`,
        kind: 'STATIC',
        reference: row.mconCodigo,
        description: row.mconAtencionA?.trim() || null,
        brand: row.mconMarca?.trim() || null,
        customerName: row.cliNombres?.trim() || '—',
        agencyName: row.agencyName?.trim() || null,
        executiveName: row.executiveName?.trim() || null,
        startDate: isoDay(row.earliestStart)!,
        endDate: isoDay(row.latestEnd)!,
        daysLeft: daysBetween(today, row.latestEnd),
        siteCount: row.totalFaces,
        spotsPerDay: null,
        value: null,
        client: clients.get(email) ?? clients.get(billing) ?? null,
        deal: null,
        isMine: false,
      };
    });
  }

  private async digitalRenewals(
    from: Date,
    to: Date,
    userId?: string,
  ): Promise<CrmRenewalItem[]> {
    const campaigns = await this.prisma.digitalBillboardCampaign.findMany({
      where: {
        endDate: { gte: from, lte: to },
        deal: { in: [...RENEWABLE_DEALS] },
      },
      select: {
        id: true,
        client: true,
        campaign: true,
        startDate: true,
        endDate: true,
        spotsPerDay: true,
        monthlyValue: true,
        totalValue: true,
        orderGroupId: true,
        sublist: { select: { digitalBillboardId: true } },
        offerItem: {
          select: {
            offer: {
              select: {
                createdByUserId: true,
                client: { select: { id: true, name: true, company: true } },
              },
            },
          },
        },
      },
    });
    const groups = new Map<string, typeof campaigns>();
    for (const c of campaigns) {
      const key = c.orderGroupId ?? c.id;
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }

    const names = [
      ...new Set(campaigns.map((c) => c.client.trim()).filter(Boolean)),
    ];
    const byName = await this.clientsByName(names);
    const today = startOfTodayUtc();

    return [...groups.entries()].map(([groupId, list]): CrmRenewalItem => {
      const first = list[0];
      const end = new Date(Math.max(...list.map((c) => c.endDate!.getTime())));
      const starts = list
        .map((c) => c.startDate?.getTime())
        .filter((t): t is number => t != null);
      const start = starts.length ? new Date(Math.min(...starts)) : end;
      const offer = list.find((c) => c.offerItem)?.offerItem?.offer;
      const monthly = list.reduce((sum, c) => sum + (c.monthlyValue ?? 0), 0);
      const total = list.find((c) => c.totalValue != null)?.totalValue ?? null;
      return {
        key: `DIGITAL:${groupId}`,
        kind: 'DIGITAL',
        reference: first.campaign || first.client,
        description: first.campaign || null,
        brand: null,
        customerName: first.client,
        agencyName: null,
        executiveName: null,
        startDate: isoDay(start)!,
        endDate: isoDay(end)!,
        daysLeft: daysBetween(today, end),
        siteCount: new Set(list.map((c) => c.sublist.digitalBillboardId)).size,
        spotsPerDay: list.reduce((sum, c) => sum + c.spotsPerDay, 0),
        value: total ?? (monthly || null),
        client:
          offer?.client ?? byName.get(normalizeText(first.client)) ?? null,
        deal: null,
        isMine: !!userId && offer?.createdByUserId === userId,
      };
    });
  }

  private async staticSource(key: string): Promise<RenewalSource | null> {
    const mconId = Number(key.slice('STATIC:'.length));
    if (!Number.isInteger(mconId)) return null;
    const today = startOfTodayUtc();
    const rows = await this.staticRenewals(
      addDays(today, -365),
      addDays(today, 365),
    );
    const contract = rows.find((r) => r.key === key);
    if (!contract)
      throw new NotFoundException(
        'Contrato no encontrado o fuera de la ventana de renovación',
      );
    const faces = await this.brilo.query<{ caraId: number }>(
      CONTRACT_FACES_SQL,
      { MconId: mconId },
    );
    return {
      reference: contract.reference,
      brand: contract.brand,
      customerName: contract.customerName,
      description: contract.description,
      clientId: contract.client?.id ?? null,
      startDate: new Date(`${contract.startDate}T00:00:00.000Z`),
      endDate: new Date(`${contract.endDate}T00:00:00.000Z`),
      sites: faces.map((f) => ({
        kind: 'STATIC' as const,
        billboardId: Number(f.caraId),
        spotsPerDay: null as number | null,
      })),
    };
  }

  private async digitalSource(key: string): Promise<RenewalSource> {
    const groupId = key.slice('DIGITAL:'.length);
    const campaigns = await this.prisma.digitalBillboardCampaign.findMany({
      where: { OR: [{ orderGroupId: groupId }, { id: groupId }] },
      select: {
        client: true,
        campaign: true,
        startDate: true,
        endDate: true,
        spotsPerDay: true,
        sublist: { select: { digitalBillboardId: true } },
        offerItem: { select: { offer: { select: { clientId: true } } } },
      },
    });
    const withEnd = campaigns.filter((c) => c.endDate);
    if (withEnd.length === 0)
      throw new NotFoundException('Campaña no encontrada');
    const end = new Date(Math.max(...withEnd.map((c) => c.endDate!.getTime())));
    const starts = withEnd
      .map((c) => c.startDate?.getTime())
      .filter((t): t is number => t != null);
    const first = withEnd[0];
    const clientId =
      withEnd.find((c) => c.offerItem)?.offerItem?.offer.clientId ??
      (await this.clientsByName([first.client])).get(
        normalizeText(first.client),
      )?.id ??
      null;

    const spotsByScreen = new Map<string, number>();
    for (const c of withEnd) {
      const id = c.sublist.digitalBillboardId;
      spotsByScreen.set(id, (spotsByScreen.get(id) ?? 0) + c.spotsPerDay);
    }
    return {
      reference: first.campaign || first.client,
      brand: null,
      customerName: first.client,
      description: first.campaign || null,
      clientId,
      startDate: starts.length ? new Date(Math.min(...starts)) : end,
      endDate: end,
      sites: [...spotsByScreen.entries()].map(
        ([digitalBillboardId, spotsPerDay]) => ({
          kind: 'DIGITAL' as const,
          digitalBillboardId,
          spotsPerDay,
        }),
      ),
    };
  }

  private async renewalDeals(
    keys: string[],
  ): Promise<Map<string, RenewalDealRow>> {
    if (keys.length === 0) return new Map();
    const rows = await this.prisma.crmDeal.findMany({
      where: { renewalOf: { in: keys } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        renewalOf: true,
        ownerId: true,
        stage: { select: { name: true } },
        owner: { select: { firstName: true, lastName: true } },
      },
    });
    const map = new Map<string, RenewalDealRow>();
    for (const row of rows) {
      const current = map.get(row.renewalOf!);
      if (!current || (current.status === 'LOST' && row.status !== 'LOST')) {
        map.set(row.renewalOf!, row);
      }
    }
    return map;
  }

  private async clientsByEmail(emails: (string | null)[]) {
    const wanted = [...new Set(emails.map(normalizeText).filter(Boolean))];
    const map = new Map<
      string,
      { id: string; name: string; company: string | null }
    >();
    if (wanted.length === 0) return map;
    const rows = await this.prisma.client.findMany({
      where: {
        OR: [
          { email: { in: wanted, mode: 'insensitive' } },
          { billingEmail: { in: wanted, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        billingEmail: true,
      },
    });
    for (const row of rows) {
      const summary = { id: row.id, name: row.name, company: row.company };
      map.set(normalizeText(row.email), summary);
      if (row.billingEmail && !map.has(normalizeText(row.billingEmail))) {
        map.set(normalizeText(row.billingEmail), summary);
      }
    }
    return map;
  }

  private async clientsByName(names: string[]) {
    const map = new Map<
      string,
      { id: string; name: string; company: string | null }
    >();
    if (names.length === 0) return map;
    const rows = await this.prisma.client.findMany({
      where: {
        OR: [
          { name: { in: names, mode: 'insensitive' } },
          { company: { in: names, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, company: true },
    });
    for (const row of rows) {
      map.set(normalizeText(row.name), row);
      if (row.company && !map.has(normalizeText(row.company))) {
        map.set(normalizeText(row.company), row);
      }
    }
    return map;
  }
}

function startOfTodayUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function nameTokens(
  user: { firstName: string; lastName: string | null } | null,
): string[] {
  if (!user) return [];
  const first = normalizeText(user.firstName).split(/\s+/)[0] ?? '';
  const last = normalizeText(user.lastName).split(/\s+/)[0] ?? '';
  return [first, last].filter((t) => t.length >= 2);
}
