import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TtlCache } from '../../lib/ttl-cache.js';
import { BillboardsService } from '../billboards/billboards.service.js';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateBillboardCostDto } from './dto/expansion.dto.js';
import {
  AVG_DAYS_PER_MONTH,
  monthlyBreakdown,
  occupiedDays,
  rate,
  resolvePeriod,
  revenueInRange,
  type ContractLine,
  type MonthBreakdown,
  type Period,
  type ProfitabilityBasis,
  type ProfitabilityTier,
} from './expansion-profitability.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const FIRST_YEAR = 2010;

const CONTRACT_LINES_SQL = `
SELECT
    detcon.caraId                 AS caraId,
    detcon.dconFechaDesde         AS [FechaDesde],
    detcon.dconFechaHasta         AS [FechaHasta],
    detcon.dconCostoArrendamiento AS [Monto],
    maecon.mconCodigo             AS [Codigo],
    cli.cliNombres                AS [Cliente]
FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
    ON maecon.mconId = detcon.mconId
LEFT JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON cli.cliId = maecon.cliId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND detcon.dconFechaDesde <= @FechaFin
  AND detcon.dconFechaHasta >= @FechaInicio;
`;

interface BriloContractLineRow {
  caraId: number;
  FechaDesde: Date;
  FechaHasta: Date;
  Monto: number | null;
  Codigo: string | null;
  Cliente: string | null;
}

export interface ExpansionBillboard {
  billboardId: number;
  code: string;
  address: string | null;
  reference: string | null;
  cityName: string | null;
  departmentName: string | null;
  latitude: number | null;
  longitude: number | null;
  width: number | null;
  height: number | null;
  formatCode: string | null;
  structureName: string | null;
  listPrice: number | null;
  occupiedNow: boolean;
  currentCustomer: string | null;
  contractsCount: number;
  customersCount: number;
  occupiedDays: number;
  occupiedMonths: number;
  occupancyRate: number;
  revenue: number;
  monthlyCost: number | null;
  costNotes: string | null;
  cost: number | null;
  profit: number | null;
  margin: number | null;
  roi: number | null;
  score: number;
  tier: ProfitabilityTier;
  basis: ProfitabilityBasis;
}

export interface ExpansionScreen {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  price: number;
  departmentName: string | null;
}

export interface ExpansionPeriod {
  from: string;
  to: string;
  days: number;
  months: number;
  year: number | null;
  label: string;
}

export interface ExpansionBillboardsResult {
  period: ExpansionPeriod;
  billboards: ExpansionBillboard[];
  screens: ExpansionScreen[];
}

export interface ExpansionBillboardContract {
  contractCode: string | null;
  customerName: string | null;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  revenueInPeriod: number;
}

export interface ExpansionBillboardDetail {
  period: ExpansionPeriod;
  billboard: ExpansionBillboard;
  months: MonthBreakdown[];
  contracts: ExpansionBillboardContract[];
  photoImageId: number | null;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toPeriodDto(period: Period): ExpansionPeriod {
  return {
    from: isoDay(period.from),
    to: isoDay(period.to),
    days: period.days,
    months: period.months,
    year: period.year,
    label: period.label,
  };
}

@Injectable()
export class ExpansionBillboardsService {
  private readonly linesCache = new TtlCache<ContractLine[]>(CACHE_TTL_MS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
    private readonly billboards: BillboardsService,
  ) {}

  async list(yearRaw?: string): Promise<ExpansionBillboardsResult> {
    const period = this.resolvePeriod(yearRaw);
    const [billboards, screens] = await Promise.all([
      this.rateBillboards(period),
      this.prisma.digitalBillboard.findMany({
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
          latitude: true,
          longitude: true,
          price: true,
          departmentName: true,
        },
      }),
    ]);
    return { period: toPeriodDto(period), billboards, screens };
  }

  async detail(
    billboardId: number,
    yearRaw?: string,
  ): Promise<ExpansionBillboardDetail> {
    const period = this.resolvePeriod(yearRaw);
    const [billboards, lines, images] = await Promise.all([
      this.rateBillboards(period),
      this.loadLines(period),
      this.billboards.getBillboardImages(billboardId),
    ]);
    const billboard = billboards.find((b) => b.billboardId === billboardId);
    if (!billboard) throw new NotFoundException('Valla no encontrada');

    const own = lines.filter((line) => line.billboardId === billboardId);
    return {
      period: toPeriodDto(period),
      billboard,
      months: monthlyBreakdown(own, period),
      contracts: own
        .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
        .map((line) => ({
          contractCode: line.contractCode,
          customerName: line.customerName,
          startDate: isoDay(line.startDate),
          endDate: isoDay(line.endDate),
          monthlyAmount: line.monthlyAmount,
          revenueInPeriod: revenueInRange(line, period.from, period.to),
        })),
      photoImageId: images[0]?.imageId ?? null,
    };
  }

  async updateCost(
    billboardId: number,
    dto: UpdateBillboardCostDto,
    userId: string,
  ): Promise<{ billboardId: number; monthlyCost: number | null }> {
    if (dto.monthlyCost == null) {
      await this.prisma.expansionBillboardCost.deleteMany({
        where: { billboardId },
      });
      return { billboardId, monthlyCost: null };
    }

    const notes = dto.notes?.trim() || null;
    const saved = await this.prisma.expansionBillboardCost.upsert({
      where: { billboardId },
      create: {
        billboardId,
        monthlyCost: dto.monthlyCost,
        notes,
        updatedByUserId: userId,
      },
      update: { monthlyCost: dto.monthlyCost, notes, updatedByUserId: userId },
      select: { billboardId: true, monthlyCost: true },
    });
    return saved;
  }

  private resolvePeriod(yearRaw?: string): Period {
    if (!yearRaw) return resolvePeriod(null);
    const year = Number(yearRaw);
    const currentYear = new Date().getUTCFullYear();
    if (!Number.isInteger(year) || year < FIRST_YEAR || year > currentYear) {
      throw new BadRequestException(
        `El año debe estar entre ${FIRST_YEAR} y ${currentYear}`,
      );
    }
    return resolvePeriod(year);
  }

  private async rateBillboards(period: Period): Promise<ExpansionBillboard[]> {
    const today = new Date(`${isoDay(new Date())}T00:00:00.000Z`);
    const [listing, lines, costs] = await Promise.all([
      this.billboards.getAvailableBillboardsInRange(today, today, {
        includeUnavailable: true,
      }),
      this.loadLines(period),
      this.prisma.expansionBillboardCost.findMany({
        select: { billboardId: true, monthlyCost: true, notes: true },
      }),
    ]);

    const linesByBillboard = new Map<number, ContractLine[]>();
    for (const line of lines) {
      const list = linesByBillboard.get(line.billboardId) ?? [];
      list.push(line);
      linesByBillboard.set(line.billboardId, list);
    }
    const costByBillboard = new Map(costs.map((c) => [c.billboardId, c]));

    return listing.map((row): ExpansionBillboard => {
      const own = linesByBillboard.get(row.billboardId) ?? [];
      const days = occupiedDays(own, period.from, period.to);
      const occupancyRate = Math.min(days / period.days, 1);
      const revenue = own.reduce(
        (sum, line) => sum + revenueInRange(line, period.from, period.to),
        0,
      );
      const costRow = costByBillboard.get(row.billboardId);
      const rating = rate({
        revenue,
        monthlyCost: costRow?.monthlyCost ?? null,
        occupancyRate,
        months: period.months,
      });
      const current = own.find(
        (line) => line.startDate <= today && line.endDate >= today,
      );

      return {
        billboardId: row.billboardId,
        code: row.billboardCode ?? String(row.billboardId),
        address: row.address,
        reference: row.reference,
        cityName: row.cityName,
        departmentName: row.departmentName,
        latitude: row.latitude,
        longitude: row.longitude,
        width: row.width,
        height: row.height,
        formatCode: row.formatCode,
        structureName: row.structureName,
        listPrice: row.price,
        occupiedNow: !row.isAvailable,
        currentCustomer: current?.customerName ?? null,
        contractsCount: new Set(own.map((l) => l.contractCode)).size,
        customersCount: new Set(
          own.map((l) => l.customerName).filter((name) => !!name),
        ).size,
        occupiedDays: days,
        occupiedMonths: days / AVG_DAYS_PER_MONTH,
        occupancyRate,
        revenue,
        monthlyCost: costRow?.monthlyCost ?? null,
        costNotes: costRow?.notes ?? null,
        ...rating,
      };
    });
  }

  private loadLines(period: Period): Promise<ContractLine[]> {
    const key = `${isoDay(period.from)}|${isoDay(period.to)}`;
    return this.linesCache.getOrFetch(key, async () => {
      const rows = await this.brilo.query<BriloContractLineRow>(
        CONTRACT_LINES_SQL,
        { FechaInicio: period.from, FechaFin: period.to },
      );
      return rows
        .filter(
          (r) => r.FechaDesde instanceof Date && r.FechaHasta instanceof Date,
        )
        .map((r) => ({
          billboardId: Number(r.caraId),
          contractCode: r.Codigo ?? null,
          customerName: r.Cliente?.trim() || null,
          startDate: r.FechaDesde,
          endDate: r.FechaHasta,
          monthlyAmount: Number(r.Monto ?? 0) || 0,
        }));
    });
  }
}
