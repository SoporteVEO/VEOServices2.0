import { Injectable } from '@nestjs/common';
import { ReportType } from '@prisma/client';
import { BriloDatabaseService } from '../../brilo-database/brilo-database.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const TOP_USERS_LIMIT = 50;
const COVERAGE_USERS_LIMIT = 50;
const MIN_NAME_TOKEN_LENGTH = 2;
const MAX_NAME_TOKENS = 4;

// Mirrors the FilteredContracts CTE used by the "Mis contratos" table and the
// My Space KPI snapshot so the compliance chart resolves the exact same set of
// active contracts (same joins, one row per mconId, honouring the "hide
// contracts created this month" rule).
const ALL_ACTIVE_CONTRACTS_SQL = `
WITH FilteredContracts AS (
    SELECT
        maecon.mconId,
        MIN(detcon.dconFechaDesde) AS earliestStart,
        MAX(maecon.mconCodigo) AS mconCodigo,
        MAX(COALESCE(ej.ejecNombre, '')) AS ejecNombre,
        MAX(COALESCE(maecon.mconAtencionA, '')) AS atencionA
    FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
    INNER JOIN olVallas.dbo.detContratos detcon WITH (NOLOCK)
        ON detcon.mconId = maecon.mconId
    INNER JOIN olVallas.dbo.Caras car WITH (NOLOCK)
        ON detcon.caraId = car.caraId
    INNER JOIN olVallas.dbo.Sitios siti WITH (NOLOCK)
        ON car.sitiId = siti.sitiId
    INNER JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
        ON maecon.cliId = cli.cliId
    LEFT JOIN olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
        ON ej.ejecId = maecon.ejecId
    WHERE maecon.mconPosteado <> 0
      AND maecon.mconAnulado <> 1
      AND detcon.dconFechaHasta >= @ActiveAsOf
      AND NOT EXISTS (
          SELECT 1
          FROM olVallas.dbo.maeContratos child WITH (NOLOCK)
          WHERE child.mconIdPadre = maecon.mconId
            AND child.mconAnulado <> 1
            AND child.mconPosteado <> 0
      )
    GROUP BY maecon.mconId
    HAVING (
        @ExcludeCreatedThisMonth = 0
        OR MIN(detcon.dconFechaDesde) < @MonthStart
        OR MIN(detcon.dconFechaDesde) >= @MonthEnd
    )
)
SELECT mconCodigo, ejecNombre, atencionA FROM FilteredContracts
`;

interface ActiveContractRow {
  mconCodigo: string;
  ejecNombre: string;
  atencionA: string;
}

export interface ReportsOverviewFilters {
  from: Date;
  /** Exclusive upper bound. */
  to: Date;
  userId?: string | null;
}

export interface ReportsTypeBreakdown {
  count: number;
  distinctContracts: number;
  distinctUsers: number;
}

export interface ReportsOverviewTotals {
  total: number;
  monthly: number;
  installation: number;
  maintenance: number;
  distinctUsers: number;
  distinctContracts: number;
  averagePerDay: number;
}

export interface ReportsTrendPoint {
  /** YYYY-MM-DD or YYYY-MM */
  key: string;
  total: number;
  monthly: number;
  installation: number;
  maintenance: number;
}

export interface ReportsByUserRow {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  totalReports: number;
  monthlyCount: number;
  installationCount: number;
  maintenanceCount: number;
}

export interface ReportsCoverageRow {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  activeContracts: number;
  monthlyReportsSent: number;
  pending: number;
  /** Percentage 0-100, rounded to one decimal. */
  coverage: number;
}

export interface ReportsCurrentMonthCompliance {
  monthKey: string;
  rangeFrom: string;
  rangeTo: string;
  activeContractsTotal: number;
  monthlyReportsSent: number;
  pending: number;
  coverage: number;
  perUser: ReportsCoverageRow[];
}

export interface ReportsOverview {
  range: { from: string; to: string };
  totals: ReportsOverviewTotals;
  byType: {
    monthly: ReportsTypeBreakdown;
    installation: ReportsTypeBreakdown;
    maintenance: ReportsTypeBreakdown;
  };
  daily: ReportsTrendPoint[];
  monthly: ReportsTrendPoint[];
  /** Monthly trend spanning the full current calendar year (Jan–Dec). */
  monthlyYear: ReportsTrendPoint[];
  byUser: ReportsByUserRow[];
  currentMonthCompliance: ReportsCurrentMonthCompliance;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function startOfCurrentYear(): Date {
  return new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
}

function startOfNextYear(): Date {
  return new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 1));
}

function enumerateMonthKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const start = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1),
  );
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  const cursor = new Date(start);
  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    keys.push(`${year}-${month}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

function enumerateDayKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const start = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  const end = new Date(
    Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate() - 1),
  );
  const cursor = new Date(start);
  while (cursor <= end) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cursor.getUTCDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function normalizeForMatch(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface NameSource {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

function buildNameTokens(source: NameSource): string[] {
  const firstName = source.firstName?.trim() ?? '';
  const lastName = source.lastName?.trim() ?? '';
  if (firstName && lastName) {
    return [firstName, lastName]
      .map((t) => normalizeForMatch(t))
      .filter((t) => t.length >= MIN_NAME_TOKEN_LENGTH);
  }
  const fallback = source.fullName?.trim() || firstName || lastName;
  if (!fallback) return [];
  return normalizeForMatch(fallback)
    .split(' ')
    .filter((t) => t.length >= MIN_NAME_TOKEN_LENGTH)
    .slice(0, MAX_NAME_TOKENS);
}

function tokensMatchTarget(tokens: string[], target: string): boolean {
  if (tokens.length === 0 || target.length === 0) return false;
  return tokens.every((token) => target.includes(token));
}

function fullDisplayName(user: {
  firstName: string;
  lastName: string | null;
  email: string;
}): string {
  const composed = [user.firstName, user.lastName]
    .filter((p) => Boolean(p && p.trim()))
    .join(' ')
    .trim();
  return composed || user.email;
}

@Injectable()
export class ReportsAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brilo: BriloDatabaseService,
  ) {}

  async getOverview(
    filters: ReportsOverviewFilters,
  ): Promise<ReportsOverview> {
    const { from, to, userId } = filters;
    const teamMemberId = userId
      ? await this.findTeamMemberIdForUser(userId)
      : null;

    // If a user filter is set but the user isn't a team member, return an empty
    // shell so the dashboard still renders predictable zeros.
    const filterIsImpossible = Boolean(userId && !teamMemberId);

    const reportsWhereTeamMemberId = teamMemberId ?? null;

    const yearStart = startOfCurrentYear();
    const yearEnd = startOfNextYear();

    const [byTypeRows, daily, monthly, monthlyYearRows, byUser, compliance] =
      await Promise.all([
        filterIsImpossible
          ? Promise.resolve(emptyByType())
          : this.aggregateByType(from, to, reportsWhereTeamMemberId),
        filterIsImpossible
          ? Promise.resolve([])
          : this.aggregateDaily(from, to, reportsWhereTeamMemberId),
        filterIsImpossible
          ? Promise.resolve([])
          : this.aggregateMonthly(from, to, reportsWhereTeamMemberId),
        filterIsImpossible
          ? Promise.resolve([])
          : this.aggregateMonthly(yearStart, yearEnd, reportsWhereTeamMemberId),
        filterIsImpossible
          ? Promise.resolve([])
          : this.aggregateByUser(from, to, reportsWhereTeamMemberId),
        this.aggregateCurrentMonthCompliance(userId ?? null, from, to),
      ]);

    const dailyKeys = enumerateDayKeys(from, to);
    const monthlyKeys = enumerateMonthKeys(from, to);
    // enumerateMonthKeys treats the upper bound as inclusive of its month, so
    // pass December to get exactly Jan–Dec of the current year.
    const yearMonthlyKeys = enumerateMonthKeys(
      yearStart,
      new Date(Date.UTC(yearStart.getUTCFullYear(), 11, 1)),
    );

    const dailyTrend = padTrend(daily, dailyKeys);
    const monthlyTrend = padTrend(monthly, monthlyKeys);
    const monthlyYearTrend = padTrend(monthlyYearRows, yearMonthlyKeys);

    const totals = this.buildTotals(byTypeRows, dailyTrend, byUser);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals,
      byType: byTypeRows,
      daily: dailyTrend,
      monthly: monthlyTrend,
      monthlyYear: monthlyYearTrend,
      byUser,
      currentMonthCompliance: compliance,
    };
  }

  private async findTeamMemberIdForUser(
    userId: string,
  ): Promise<string | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: { userId },
      select: { id: true },
    });
    return member?.id ?? null;
  }

  private async aggregateByType(
    from: Date,
    to: Date,
    teamMemberId: string | null,
  ): Promise<ReportsOverview['byType']> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        report_type: ReportType;
        report_count: bigint | number;
        distinct_contracts: bigint | number;
        distinct_users: bigint | number;
      }>
    >`
      SELECT
        "reportType" AS report_type,
        COUNT(*)::bigint AS report_count,
        COUNT(DISTINCT "contract_number")::bigint AS distinct_contracts,
        COUNT(DISTINCT "team_member_id")::bigint AS distinct_users
      FROM "report_sended"
      WHERE "createdAt" >= ${from}
        AND "createdAt" < ${to}
        AND (${teamMemberId}::text IS NULL OR "team_member_id" = ${teamMemberId})
      GROUP BY 1
    `;

    const byType = emptyByType();
    for (const row of rows) {
      const breakdown: ReportsTypeBreakdown = {
        count: Number(row.report_count ?? 0),
        distinctContracts: Number(row.distinct_contracts ?? 0),
        distinctUsers: Number(row.distinct_users ?? 0),
      };
      if (row.report_type === ReportType.MONTHLY) byType.monthly = breakdown;
      else if (row.report_type === ReportType.INSTALLATION)
        byType.installation = breakdown;
      else if (row.report_type === ReportType.MAINTENANCE)
        byType.maintenance = breakdown;
    }
    return byType;
  }

  private async aggregateDaily(
    from: Date,
    to: Date,
    teamMemberId: string | null,
  ): Promise<ReportsTrendPoint[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        key: string;
        report_type: ReportType;
        report_count: bigint | number;
      }>
    >`
      SELECT
        to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS key,
        "reportType" AS report_type,
        COUNT(*)::bigint AS report_count
      FROM "report_sended"
      WHERE "createdAt" >= ${from}
        AND "createdAt" < ${to}
        AND (${teamMemberId}::text IS NULL OR "team_member_id" = ${teamMemberId})
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;
    return collapseTrendRows(rows);
  }

  private async aggregateMonthly(
    from: Date,
    to: Date,
    teamMemberId: string | null,
  ): Promise<ReportsTrendPoint[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        key: string;
        report_type: ReportType;
        report_count: bigint | number;
      }>
    >`
      SELECT
        to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS key,
        "reportType" AS report_type,
        COUNT(*)::bigint AS report_count
      FROM "report_sended"
      WHERE "createdAt" >= ${from}
        AND "createdAt" < ${to}
        AND (${teamMemberId}::text IS NULL OR "team_member_id" = ${teamMemberId})
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;
    return collapseTrendRows(rows);
  }

  private async aggregateByUser(
    from: Date,
    to: Date,
    teamMemberId: string | null,
  ): Promise<ReportsByUserRow[]> {
    const grouped = await this.prisma.reportSended.groupBy({
      by: ['teamMemberId', 'reportType'],
      where: {
        createdAt: { gte: from, lt: to },
        ...(teamMemberId ? { teamMemberId } : {}),
      },
      _count: { _all: true },
    });

    if (grouped.length === 0) return [];

    const teamMemberIds = Array.from(
      new Set(grouped.map((row) => row.teamMemberId)),
    );
    const teamMembers = await this.prisma.teamMember.findMany({
      where: { id: { in: teamMemberIds } },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    const memberById = new Map(teamMembers.map((m) => [m.id, m]));

    const map = new Map<string, ReportsByUserRow>();
    for (const row of grouped) {
      const member = memberById.get(row.teamMemberId);
      if (!member) continue;
      const userId = member.user.id;
      const existing = map.get(userId) ?? {
        userId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        totalReports: 0,
        monthlyCount: 0,
        installationCount: 0,
        maintenanceCount: 0,
      };
      const count = row._count?._all ?? 0;
      existing.totalReports += count;
      if (row.reportType === ReportType.MONTHLY) existing.monthlyCount += count;
      else if (row.reportType === ReportType.INSTALLATION)
        existing.installationCount += count;
      else if (row.reportType === ReportType.MAINTENANCE)
        existing.maintenanceCount += count;
      map.set(userId, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.totalReports - a.totalReports)
      .slice(0, TOP_USERS_LIMIT);
  }

  private async aggregateCurrentMonthCompliance(
    userId: string | null,
    from: Date,
    to: Date,
  ): Promise<ReportsCurrentMonthCompliance> {
    // Monthly reports are counted within the selected range; the pool of active
    // contracts is still measured "as of today" (an inherently current concept).
    const monthKey = `${from.getUTCFullYear()}-${String(
      from.getUTCMonth() + 1,
    ).padStart(2, '0')}`;

    // Pull every team member with a user — they're the universe of potential
    // advisors that can both send reports and be matched to active contracts.
    const teamMembers = await this.prisma.teamMember.findMany({
      where: userId
        ? { userId }
        : { user: { disabled: false } },
      select: {
        id: true,
        userId: true,
        fullName: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const baseResponse: ReportsCurrentMonthCompliance = {
      monthKey,
      rangeFrom: from.toISOString(),
      rangeTo: to.toISOString(),
      activeContractsTotal: 0,
      monthlyReportsSent: 0,
      pending: 0,
      coverage: 0,
      perUser: [],
    };

    if (teamMembers.length === 0) return baseResponse;

    let activeContracts: ActiveContractRow[] = [];
    try {
      activeContracts = await this.brilo.query<ActiveContractRow>(
        ALL_ACTIVE_CONTRACTS_SQL,
        {
          ActiveAsOf: startOfToday(),
          ExcludeCreatedThisMonth: 1,
          MonthStart: startOfCurrentMonth(),
          MonthEnd: startOfNextMonth(),
        },
      );
    } catch {
      // If Brilo is unavailable, fall back to zero active contracts so the
      // dashboard keeps working with sent-only data.
      activeContracts = [];
    }

    const normalizedContracts = activeContracts.map((row) => ({
      mconCodigo: row.mconCodigo,
      ejecNombre: normalizeForMatch(row.ejecNombre),
      atencionA: normalizeForMatch(row.atencionA),
    }));

    const activeContractNumbers = Array.from(
      new Set(
        normalizedContracts
          .map((row) => row.mconCodigo)
          .filter((code) => Boolean(code)),
      ),
    );

    // A contract counts as "reported" when it has a monthly report in the range
    // sent by anyone — mirrors the My Space snapshot, which does not restrict by
    // author, only by the active contract set.
    const sentRows =
      activeContractNumbers.length === 0
        ? []
        : await this.prisma.reportSended.findMany({
            where: {
              contractNumber: { in: activeContractNumbers },
              reportType: ReportType.MONTHLY,
              createdAt: { gte: from, lt: to },
            },
            select: { contractNumber: true },
            distinct: ['contractNumber'],
          });
    const sentContractSet = new Set(sentRows.map((row) => row.contractNumber));

    const userRows: ReportsCoverageRow[] = teamMembers.map((member) => {
      const tokens = buildNameTokens({
        fullName: member.fullName,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
      });
      const matchedContracts = new Set<string>();
      if (tokens.length > 0) {
        for (const contract of normalizedContracts) {
          if (
            tokensMatchTarget(tokens, contract.ejecNombre) ||
            tokensMatchTarget(tokens, contract.atencionA)
          ) {
            matchedContracts.add(contract.mconCodigo);
          }
        }
      }

      const activeContractsForUser = matchedContracts.size;
      // Sent = the user's matched active contracts that have a monthly report,
      // so it can never exceed the active count (pending stays meaningful).
      let monthlyReportsSent = 0;
      for (const code of matchedContracts) {
        if (sentContractSet.has(code)) monthlyReportsSent += 1;
      }
      const pending = activeContractsForUser - monthlyReportsSent;
      const coverage =
        activeContractsForUser > 0
          ? Math.round(
              (monthlyReportsSent / activeContractsForUser) * 1000,
            ) / 10
          : 0;

      return {
        userId: member.userId,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        activeContracts: activeContractsForUser,
        monthlyReportsSent,
        pending,
        coverage,
      };
    });

    // Header totals are the sum of the per-user rows so the summary always
    // equals the bars shown in the chart.
    const activeContractsTotal = userRows.reduce(
      (sum, row) => sum + row.activeContracts,
      0,
    );
    const monthlyReportsSent = userRows.reduce(
      (sum, row) => sum + row.monthlyReportsSent,
      0,
    );
    const pending = userRows.reduce((sum, row) => sum + row.pending, 0);
    const coverage =
      activeContractsTotal > 0
        ? Math.round((monthlyReportsSent / activeContractsTotal) * 1000) / 10
        : 0;

    const perUser = userRows
      .filter((row) => row.activeContracts > 0 || row.monthlyReportsSent > 0)
      .sort((a, b) => {
        if (b.activeContracts !== a.activeContracts) {
          return b.activeContracts - a.activeContracts;
        }
        return b.monthlyReportsSent - a.monthlyReportsSent;
      })
      .slice(0, COVERAGE_USERS_LIMIT);

    return {
      monthKey,
      rangeFrom: from.toISOString(),
      rangeTo: to.toISOString(),
      activeContractsTotal,
      monthlyReportsSent,
      pending,
      coverage,
      perUser,
    };
  }

  private buildTotals(
    byType: ReportsOverview['byType'],
    daily: ReportsTrendPoint[],
    byUser: ReportsByUserRow[],
  ): ReportsOverviewTotals {
    const total =
      byType.monthly.count +
      byType.installation.count +
      byType.maintenance.count;

    const distinctContracts = Math.max(
      byType.monthly.distinctContracts,
      byType.installation.distinctContracts,
      byType.maintenance.distinctContracts,
    );

    const days = daily.length || 1;
    const averagePerDay = Math.round((total / days) * 100) / 100;

    return {
      total,
      monthly: byType.monthly.count,
      installation: byType.installation.count,
      maintenance: byType.maintenance.count,
      distinctUsers: byUser.length,
      distinctContracts,
      averagePerDay,
    };
  }
}

function emptyByType(): ReportsOverview['byType'] {
  const empty: ReportsTypeBreakdown = {
    count: 0,
    distinctContracts: 0,
    distinctUsers: 0,
  };
  return {
    monthly: { ...empty },
    installation: { ...empty },
    maintenance: { ...empty },
  };
}

function collapseTrendRows(
  rows: Array<{
    key: string;
    report_type: ReportType;
    report_count: bigint | number;
  }>,
): ReportsTrendPoint[] {
  const map = new Map<string, ReportsTrendPoint>();
  for (const row of rows) {
    const existing = map.get(row.key) ?? {
      key: row.key,
      total: 0,
      monthly: 0,
      installation: 0,
      maintenance: 0,
    };
    const count = Number(row.report_count ?? 0);
    existing.total += count;
    if (row.report_type === ReportType.MONTHLY) existing.monthly += count;
    else if (row.report_type === ReportType.INSTALLATION)
      existing.installation += count;
    else if (row.report_type === ReportType.MAINTENANCE)
      existing.maintenance += count;
    map.set(row.key, existing);
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function padTrend(
  data: ReportsTrendPoint[],
  expectedKeys: string[],
): ReportsTrendPoint[] {
  if (expectedKeys.length === 0) return data;
  const map = new Map(data.map((d) => [d.key, d]));
  return expectedKeys.map(
    (key) =>
      map.get(key) ?? {
        key,
        total: 0,
        monthly: 0,
        installation: 0,
        maintenance: 0,
      },
  );
}
