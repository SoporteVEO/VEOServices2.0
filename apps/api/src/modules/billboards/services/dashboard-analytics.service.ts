import { Injectable, Logger } from '@nestjs/common';
import { BriloDatabaseService } from '../../brilo-database/brilo-database.service.js';
import { TtlCache } from '../../../lib/ttl-cache.js';
import type {
  BillboardDashboardAnalytics,
  DashboardDepartmentBreakdown,
  DashboardKpis,
  DashboardMonthlyTrend,
  DashboardTopBillboard,
  DashboardTopCustomer,
  DashboardYoyTrend,
} from '../entities/available-billboard.js';

const CACHE_TTL_MS =
  Number(process.env.BILLBOARD_CACHE_TTL_MS) || 5 * 60 * 1000;

const VEO_COST_CENTER_ID = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const AVG_DAYS_PER_MONTH = 30.4375;
const TOP_LIST_SIZE = 10;

interface BriloDashboardContractRow {
  DetalleId: number;
  FechaDesde: Date;
  FechaHasta: Date;
  CaraId: number;
  CaraCodigo: string | null;
  Direccion: string | null;
  DptoId: number | null;
  DptoNombre: string | null;
  MuniNombre: string | null;
  CliId: number | null;
  CliNombres: string | null;
  CliEmail: string | null;
  PrecioMensual: number | null;
}

interface BriloDashboardTotalsRow {
  DptoId: number | null;
  DptoNombre: string | null;
  Total: number;
}

interface BriloDashboardSaleRow {
  InvoiceId: number;
  Fecha: Date;
  TipoDoc: string;
  Total: number | null;
  CliId: number | null;
  CliNombres: string | null;
  CliEmail: string | null;
}

const DASHBOARD_CONTRACTS_SQL = `
SELECT
    detcon.dconId          AS [DetalleId],
    detcon.dconFechaDesde  AS [FechaDesde],
    detcon.dconFechaHasta  AS [FechaHasta],
    car.caraId             AS [CaraId],
    car.caraCodigo         AS [CaraCodigo],
    siti.sitiDireccion     AS [Direccion],
    dpto.dptoId            AS [DptoId],
    dpto.dptoNombre        AS [DptoNombre],
    muni.muniNombre        AS [MuniNombre],
    cli.cliId              AS [CliId],
    cli.cliNombres         AS [CliNombres],
    cli.cliEmail           AS [CliEmail],
    ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) AS [PrecioMensual]
FROM olVallas.dbo.detContratos detcon WITH (NOLOCK)
INNER JOIN olVallas.dbo.maeContratos maecon WITH (NOLOCK)
    ON maecon.mconId = detcon.mconId
INNER JOIN olVallas.dbo.Caras car WITH (NOLOCK)
    ON car.caraId = detcon.caraId
INNER JOIN olVallas.dbo.Sitios siti WITH (NOLOCK)
    ON siti.sitiId = car.sitiId
LEFT JOIN olComun.dbo.DeptosEstados dpto WITH (NOLOCK)
    ON siti.dptoId = dpto.dptoId
LEFT JOIN olComun.dbo.MuniCondados muni WITH (NOLOCK)
    ON siti.muniId = muni.muniId
LEFT JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON cli.cliId = maecon.cliId
LEFT JOIN (
    SELECT
        pc1.caraId,
        MAX(CASE WHEN tp1.tiprEsDefault = 1 THEN pc1.prcaPrecio ELSE NULL END) AS prcaPrecioMax,
        MAX(pc1.prcaPrecio) AS Precio
    FROM olVallas.dbo.PreciosXCaras pc1 WITH (NOLOCK)
    INNER JOIN olVallas.dbo.TiposPrecios tp1 WITH (NOLOCK)
        ON pc1.tiprId = tp1.tiprId
    GROUP BY pc1.caraId
) AS prca_def
    ON prca_def.caraId = car.caraId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND detcon.dconFechaDesde <= @FechaFin
  AND detcon.dconFechaHasta >= @FechaInicio
  AND NOT EXISTS (
      SELECT 1
      FROM olVallas.dbo.maeContratos child WITH (NOLOCK)
      WHERE child.mconIdPadre = maecon.mconId
        AND child.mconAnulado <> 1
        AND child.mconPosteado <> 0
  );
`;

const DASHBOARD_BILLBOARD_TOTALS_SQL = `
SELECT
    dpto.dptoId      AS [DptoId],
    dpto.dptoNombre  AS [DptoNombre],
    COUNT(DISTINCT car.caraId) AS [Total]
FROM olVallas.dbo.Caras car WITH (NOLOCK)
INNER JOIN olVallas.dbo.Sitios siti WITH (NOLOCK)
    ON siti.sitiId = car.sitiId
LEFT JOIN olComun.dbo.DeptosEstados dpto WITH (NOLOCK)
    ON siti.dptoId = dpto.dptoId
LEFT JOIN (
    SELECT
        pc1.caraId,
        MAX(CASE WHEN tp1.tiprEsDefault = 1 THEN pc1.prcaPrecio ELSE NULL END) AS prcaPrecioMax,
        MAX(pc1.prcaPrecio) AS Precio
    FROM olVallas.dbo.PreciosXCaras pc1 WITH (NOLOCK)
    INNER JOIN olVallas.dbo.TiposPrecios tp1 WITH (NOLOCK)
        ON pc1.tiprId = tp1.tiprId
    GROUP BY pc1.caraId
) AS prca_def
    ON prca_def.caraId = car.caraId
WHERE car.caraActivo = 1
  AND siti.sitiActivo = 1
  AND ISNULL(prca_def.prcaPrecioMax, prca_def.Precio) >= 5
GROUP BY dpto.dptoId, dpto.dptoNombre;
`;

const DASHBOARD_SALES_SQL = `
SELECT
    mf.mfaId AS [InvoiceId],
    mf.mfaFecha AS [Fecha],
    mf.mfaTipoDoc AS [TipoDoc],
    ((ISNULL(mf.mfaSumasAfecto, 0) + ISNULL(mf.mfaSumasExento, 0)) * ISNULL(tdv.tdvnSignoVenta, 1)) AS [Total],
    cli.cliId AS [CliId],
    cli.cliNombres AS [CliNombres],
    cli.cliEmail AS [CliEmail]
FROM olVentas.dbo.maeFacturas mf WITH (NOLOCK)
LEFT JOIN olVentas.dbo.TiposDocVen tdv WITH (NOLOCK)
    ON tdv.tdvnCodigo = mf.mfaTipoDoc
LEFT JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON cli.cliId = mf.cliIdInvoiceTo
WHERE mf.mfaFecha >= @FechaInicio
  AND mf.mfaFecha < @FechaFin
  AND mf.mfaAnulada = 0
  AND mf.mfaPosteada = 1
  AND mf.cecoId = @CecoId
  AND mf.mfaTipoDoc IN ('CCF', 'FCF', 'NDC');
`;

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function daysBetween(from: Date, to: Date): number {
  const diff = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.max(0, Math.floor(diff / MS_PER_DAY) + 1);
}

function overlapDays(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): number {
  const start = startA > startB ? startA : startB;
  const end = endA < endB ? endA : endB;
  if (start > end) return 0;
  return daysBetween(start, end);
}

function monthKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function shiftYears(date: Date, years: number): Date {
  return new Date(
    date.getFullYear() + years,
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function shiftMonthKey(key: string, monthsDelta: number): string {
  const [yearStr, monthStr] = key.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return key;
  const baseDate = new Date(year, month - 1, 1);
  return monthKey(addMonths(baseDate, monthsDelta));
}

/**
 * Convert the inclusive-end "to" date used by the rest of the dashboard into
 * an exclusive boundary suitable for SQL Server `mfaFecha < @FechaFin`
 * comparisons (invoices have time components, contracts are date-only).
 */
function toExclusiveEnd(to: Date): Date {
  const exclusive = new Date(to.getTime());
  exclusive.setUTCDate(exclusive.getUTCDate() + 1);
  return exclusive;
}

function buildEmptyMonthlyMap<T>(
  rangeFrom: Date,
  rangeTo: Date,
  factory: () => T,
): Map<string, T> {
  const map = new Map<string, T>();
  let cursor = startOfMonth(rangeFrom);
  const cursorEnd = startOfMonth(rangeTo);
  while (cursor <= cursorEnd) {
    map.set(monthKey(cursor), factory());
    cursor = addMonths(cursor, 1);
  }
  return map;
}

interface MonthlySalesAgg {
  revenue: number;
  invoiceCount: number;
}

function computeMonthlySales(
  saleRows: BriloDashboardSaleRow[],
  rangeFrom: Date,
  rangeTo: Date,
): Map<string, MonthlySalesAgg> {
  const buckets = buildEmptyMonthlyMap<MonthlySalesAgg>(
    rangeFrom,
    rangeTo,
    () => ({ revenue: 0, invoiceCount: 0 }),
  );

  for (const row of saleRows) {
    if (!(row.Fecha instanceof Date)) continue;
    const total = row.Total != null ? Number(row.Total) : 0;
    if (!Number.isFinite(total)) continue;
    const key = monthKey(row.Fecha);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += total;
    bucket.invoiceCount += 1;
  }

  return buckets;
}

interface DashboardComputationInput {
  contractRows: BriloDashboardContractRow[];
  totalsRows: BriloDashboardTotalsRow[];
  saleRows: BriloDashboardSaleRow[];
  previousSaleRows: BriloDashboardSaleRow[];
  rangeFrom: Date;
  rangeTo: Date;
}

@Injectable()
export class DashboardAnalyticsService {
  private readonly logger = new Logger(DashboardAnalyticsService.name);
  private readonly cache = new TtlCache<BillboardDashboardAnalytics>(
    CACHE_TTL_MS,
  );

  constructor(private readonly brilo: BriloDatabaseService) {
    this.logger.log(`Dashboard analytics cache TTL: ${CACHE_TTL_MS}ms`);
  }

  async getDashboardAnalytics(
    from: Date,
    to: Date,
  ): Promise<BillboardDashboardAnalytics> {
    const key = `${from.toISOString()}|${to.toISOString()}`;
    return this.cache.getOrFetch(key, () =>
      this.fetchDashboardAnalytics(from, to),
    );
  }

  private async fetchDashboardAnalytics(
    from: Date,
    to: Date,
  ): Promise<BillboardDashboardAnalytics> {
    const previousFrom = shiftYears(from, -1);
    const previousTo = shiftYears(to, -1);

    const exclusiveTo = toExclusiveEnd(to);
    const previousExclusiveTo = toExclusiveEnd(previousTo);

    const [contractRows, totalsRows, saleRows, previousSaleRows] =
      await Promise.all([
        this.brilo.query<BriloDashboardContractRow>(DASHBOARD_CONTRACTS_SQL, {
          FechaInicio: from,
          FechaFin: to,
        }),
        this.brilo.query<BriloDashboardTotalsRow>(
          DASHBOARD_BILLBOARD_TOTALS_SQL,
        ),
        this.brilo.query<BriloDashboardSaleRow>(DASHBOARD_SALES_SQL, {
          FechaInicio: from,
          FechaFin: exclusiveTo,
          CecoId: VEO_COST_CENTER_ID,
        }),
        this.brilo.query<BriloDashboardSaleRow>(DASHBOARD_SALES_SQL, {
          FechaInicio: previousFrom,
          FechaFin: previousExclusiveTo,
          CecoId: VEO_COST_CENTER_ID,
        }),
      ]);

    return computeDashboardAnalytics({
      contractRows,
      totalsRows,
      saleRows,
      previousSaleRows,
      rangeFrom: from,
      rangeTo: to,
    });
  }
}

function computeDashboardAnalytics({
  contractRows,
  totalsRows,
  saleRows,
  previousSaleRows,
  rangeFrom,
  rangeTo,
}: DashboardComputationInput): BillboardDashboardAnalytics {
  const today = startOfDay(new Date());
  const endingSoonThreshold = new Date(today.getTime() + 30 * MS_PER_DAY);

  const validContracts = contractRows.filter(
    (r) => r.FechaDesde instanceof Date && r.FechaHasta instanceof Date,
  );

  const totalContracts = validContracts.length;
  const billboardsOccupied = new Set<number>();
  let activeContractsToday = 0;
  let endingSoonCount = 0;
  let totalContractDays = 0;

  type BillboardAgg = {
    billboardId: number;
    billboardCode: string | null;
    address: string | null;
    cityName: string | null;
    departmentName: string | null;
    contractsCount: number;
    occupiedDays: number;
    estimatedRevenue: number;
    monthlyPrice: number | null;
  };

  type DepartmentAgg = {
    departmentId: number | null;
    departmentName: string | null;
    occupiedBillboards: Set<number>;
    contractsCount: number;
    estimatedRevenue: number;
  };

  const billboardAggs = new Map<number, BillboardAgg>();
  const departmentAggs = new Map<string, DepartmentAgg>();
  const monthlyContractAggs = buildEmptyMonthlyMap(rangeFrom, rangeTo, () => ({
    contractsStarted: 0,
    contractsActive: 0,
  }));

  for (const row of validContracts) {
    const start = row.FechaDesde;
    const end = row.FechaHasta;
    const monthlyPrice =
      row.PrecioMensual != null ? Number(row.PrecioMensual) : null;
    const safeMonthlyPrice =
      monthlyPrice != null && Number.isFinite(monthlyPrice) && monthlyPrice > 0
        ? monthlyPrice
        : null;

    const dailyRate =
      safeMonthlyPrice != null ? safeMonthlyPrice / AVG_DAYS_PER_MONTH : 0;

    const overlapWithRange = overlapDays(start, end, rangeFrom, rangeTo);
    const overlapRevenue = dailyRate * overlapWithRange;

    totalContractDays += overlapWithRange;

    const billboardId = Number(row.CaraId);
    if (Number.isFinite(billboardId)) {
      billboardsOccupied.add(billboardId);
    }

    if (start <= today && today <= end) {
      activeContractsToday += 1;
    }
    if (end >= today && end <= endingSoonThreshold) {
      endingSoonCount += 1;
    }

    if (Number.isFinite(billboardId)) {
      const existing = billboardAggs.get(billboardId);
      if (existing) {
        existing.contractsCount += 1;
        existing.occupiedDays += overlapWithRange;
        existing.estimatedRevenue += overlapRevenue;
      } else {
        billboardAggs.set(billboardId, {
          billboardId,
          billboardCode: row.CaraCodigo ?? null,
          address: row.Direccion ?? null,
          cityName: row.MuniNombre ?? null,
          departmentName: row.DptoNombre ?? null,
          contractsCount: 1,
          occupiedDays: overlapWithRange,
          estimatedRevenue: overlapRevenue,
          monthlyPrice: safeMonthlyPrice,
        });
      }
    }

    const departmentKey = row.DptoId != null ? `id:${row.DptoId}` : 'unknown';
    const existingDept = departmentAggs.get(departmentKey);
    if (existingDept) {
      existingDept.contractsCount += 1;
      existingDept.estimatedRevenue += overlapRevenue;
      if (Number.isFinite(billboardId)) {
        existingDept.occupiedBillboards.add(billboardId);
      }
    } else {
      const occupied = new Set<number>();
      if (Number.isFinite(billboardId)) occupied.add(billboardId);
      departmentAggs.set(departmentKey, {
        departmentId: row.DptoId ?? null,
        departmentName: row.DptoNombre ?? null,
        occupiedBillboards: occupied,
        contractsCount: 1,
        estimatedRevenue: overlapRevenue,
      });
    }

    const startMonth = startOfMonth(start >= rangeFrom ? start : rangeFrom);
    const endMonth = startOfMonth(end <= rangeTo ? end : rangeTo);
    let monthCursor = startMonth;
    while (monthCursor <= endMonth) {
      const key = monthKey(monthCursor);
      const monthBucket = monthlyContractAggs.get(key);
      if (monthBucket) {
        monthBucket.contractsActive += 1;
        if (
          start.getFullYear() === monthCursor.getFullYear() &&
          start.getMonth() === monthCursor.getMonth() &&
          start >= rangeFrom
        ) {
          monthBucket.contractsStarted += 1;
        }
      }
      monthCursor = addMonths(monthCursor, 1);
    }
  }

  type CustomerAgg = {
    name: string;
    email: string | null;
    invoicesCount: number;
    totalSpent: number;
    lastInvoiceDate: Date | null;
  };

  const customerAggs = new Map<string, CustomerAgg>();
  const customersInRange = new Set<string>();
  let totalRevenue = 0;
  let totalInvoiceCount = 0;

  const monthlySalesAggs = buildEmptyMonthlyMap<MonthlySalesAgg>(
    rangeFrom,
    rangeTo,
    () => ({ revenue: 0, invoiceCount: 0 }),
  );

  for (const row of saleRows) {
    if (!(row.Fecha instanceof Date)) continue;
    const total = row.Total != null ? Number(row.Total) : 0;
    if (!Number.isFinite(total)) continue;

    totalRevenue += total;
    totalInvoiceCount += 1;

    const key = monthKey(row.Fecha);
    const bucket = monthlySalesAggs.get(key);
    if (bucket) {
      bucket.revenue += total;
      bucket.invoiceCount += 1;
    }

    const customerKey = row.CliId
      ? `id:${row.CliId}`
      : row.CliEmail
        ? `email:${row.CliEmail.toLowerCase()}`
        : row.CliNombres
          ? `name:${row.CliNombres.trim().toLowerCase()}`
          : null;

    if (customerKey) {
      customersInRange.add(customerKey);
      const existing = customerAggs.get(customerKey);
      if (existing) {
        existing.invoicesCount += 1;
        existing.totalSpent += total;
        if (!existing.lastInvoiceDate || row.Fecha > existing.lastInvoiceDate) {
          existing.lastInvoiceDate = row.Fecha;
        }
      } else {
        const cleanName = row.CliNombres?.replace(/\s+/g, ' ').trim();
        customerAggs.set(customerKey, {
          name: cleanName || row.CliEmail || 'Sin nombre',
          email: row.CliEmail ?? null,
          invoicesCount: 1,
          totalSpent: total,
          lastInvoiceDate: row.Fecha,
        });
      }
    }
  }

  const totalsByDept = new Map<
    string,
    { total: number; name: string | null }
  >();
  let totalBillboards = 0;
  for (const row of totalsRows) {
    const key = row.DptoId != null ? `id:${row.DptoId}` : 'unknown';
    const total = Number(row.Total ?? 0);
    totalBillboards += total;
    totalsByDept.set(key, { total, name: row.DptoNombre ?? null });
  }

  const occupiedBillboards = billboardsOccupied.size;
  const availableBillboards = Math.max(0, totalBillboards - occupiedBillboards);
  const occupancyRate =
    totalBillboards > 0 ? occupiedBillboards / totalBillboards : 0;
  const averageInvoiceValue =
    totalInvoiceCount > 0 ? totalRevenue / totalInvoiceCount : 0;

  const kpis: DashboardKpis = {
    totalBillboards,
    occupiedBillboards,
    availableBillboards,
    occupancyRate,
    totalContracts,
    activeContractsToday,
    endingSoon: endingSoonCount,
    uniqueCustomers: customersInRange.size,
    estimatedRevenue: totalRevenue,
    averageContractValue: averageInvoiceValue,
    totalContractDays,
  };

  const monthlyTrend: DashboardMonthlyTrend[] = [...monthlySalesAggs.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, sales]) => {
      const contracts = monthlyContractAggs.get(month) ?? {
        contractsStarted: 0,
        contractsActive: 0,
      };
      return {
        monthKey: month,
        contractsStarted: contracts.contractsStarted,
        contractsActive: contracts.contractsActive,
        estimatedRevenue: sales.revenue,
      };
    });

  const topCustomers: DashboardTopCustomer[] = [...customerAggs.values()]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, TOP_LIST_SIZE)
    .map((c) => ({
      name: c.name,
      email: c.email,
      contractsCount: c.invoicesCount,
      estimatedSpent: c.totalSpent,
      lastContractEnd: c.lastInvoiceDate,
    }));

  const topBillboards: DashboardTopBillboard[] = [...billboardAggs.values()]
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, TOP_LIST_SIZE)
    .map((b) => ({
      billboardId: b.billboardId,
      billboardCode: b.billboardCode,
      address: b.address,
      cityName: b.cityName,
      departmentName: b.departmentName,
      contractsCount: b.contractsCount,
      occupiedDays: b.occupiedDays,
      estimatedRevenue: b.estimatedRevenue,
      monthlyPrice: b.monthlyPrice,
    }));

  const departmentKeys: string[] = [];
  for (const k of departmentAggs.keys()) departmentKeys.push(k);
  for (const k of totalsByDept.keys()) {
    if (!departmentKeys.includes(k)) departmentKeys.push(k);
  }

  const byDepartment: DashboardDepartmentBreakdown[] = [];
  for (const key of departmentKeys) {
    const agg = departmentAggs.get(key);
    const totals = totalsByDept.get(key);
    const totalBillboardsForDept: number = totals?.total ?? 0;
    const contractsCountForDept: number = agg?.contractsCount ?? 0;
    if (totalBillboardsForDept <= 0 && contractsCountForDept <= 0) continue;
    byDepartment.push({
      departmentId: agg?.departmentId ?? null,
      departmentName: agg?.departmentName ?? totals?.name ?? null,
      totalBillboards: totalBillboardsForDept,
      occupiedBillboards: agg?.occupiedBillboards.size ?? 0,
      contractsCount: contractsCountForDept,
      estimatedRevenue: agg?.estimatedRevenue ?? 0,
    });
  }
  byDepartment.sort(
    (
      a: DashboardDepartmentBreakdown,
      b: DashboardDepartmentBreakdown,
    ): number => b.estimatedRevenue - a.estimatedRevenue,
  );

  const previousMonthlyRevenue = computeMonthlySales(
    previousSaleRows,
    shiftYears(rangeFrom, -1),
    shiftYears(rangeTo, -1),
  );

  const yoyTrend: DashboardYoyTrend[] = monthlyTrend.map((m) => {
    const prevKey = shiftMonthKey(m.monthKey, -12);
    const prev = previousMonthlyRevenue.get(prevKey);
    return {
      monthKey: m.monthKey,
      current: m.estimatedRevenue,
      previous: prev?.revenue ?? 0,
    };
  });

  return {
    kpis,
    monthlyTrend,
    yoyTrend,
    topCustomers,
    topBillboards,
    byDepartment,
  };
}
