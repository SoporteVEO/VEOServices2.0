const DAY_MS = 24 * 60 * 60 * 1000;

export const AVG_DAYS_PER_MONTH = 365.25 / 12;

/** Revenue/cost ratio that maps to a perfect score. */
const ROI_FOR_FULL_SCORE = 3;

const ROI_TIERS = { high: 2.5, medium: 1.5, low: 1 };
const OCCUPANCY_TIERS = { high: 0.75, medium: 0.5, low: 0.25 };

export type ProfitabilityTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

/**
 * `COST` once someone has recorded the billboard's monthly cost; until then the
 * rating can only reflect how much of the period the billboard was sold.
 */
export type ProfitabilityBasis = 'COST' | 'OCCUPANCY';

export interface ContractLine {
  billboardId: number;
  contractCode: string | null;
  customerName: string | null;
  startDate: Date;
  endDate: Date;
  monthlyAmount: number;
}

export interface Period {
  from: Date;
  to: Date;
  days: number;
  months: number;
  year: number | null;
  label: string;
}

export interface Rating {
  cost: number | null;
  profit: number | null;
  margin: number | null;
  roi: number | null;
  score: number;
  tier: ProfitabilityTier;
  basis: ProfitabilityBasis;
}

export interface MonthBreakdown {
  month: string;
  occupancy: number;
  revenue: number;
}

function dayNumber(date: Date): number {
  return Math.floor(date.getTime() / DAY_MS);
}

function utcToday(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function spanDays(from: Date, to: Date): number {
  return dayNumber(to) - dayNumber(from) + 1;
}

/**
 * A calendar year runs up to today when it is the current one, so the months
 * still ahead don't count as empty. Without a year it is the trailing 12 months.
 */
export function resolvePeriod(year: number | null, now = new Date()): Period {
  const today = utcToday(now);
  let from: Date;
  let to: Date;
  let label: string;

  if (year != null) {
    from = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    to = yearEnd < today ? yearEnd : today;
    label = yearEnd < today ? String(year) : `${year} (a la fecha)`;
  } else {
    from = new Date(
      Date.UTC(
        today.getUTCFullYear() - 1,
        today.getUTCMonth(),
        today.getUTCDate() + 1,
      ),
    );
    to = today;
    label = 'Últimos 12 meses';
  }

  const days = spanDays(from, to);
  return { from, to, days, months: days / AVG_DAYS_PER_MONTH, year, label };
}

function clipToRange(
  line: ContractLine,
  from: Date,
  to: Date,
): [number, number] | null {
  const start = Math.max(dayNumber(line.startDate), dayNumber(from));
  const end = Math.min(dayNumber(line.endDate), dayNumber(to));
  return end >= start ? [start, end] : null;
}

/** Days covered by at least one contract; overlapping contracts count once. */
export function occupiedDays(
  lines: ContractLine[],
  from: Date,
  to: Date,
): number {
  const ranges = lines
    .map((line) => clipToRange(line, from, to))
    .filter((range): range is [number, number] => range !== null)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let current: [number, number] | null = null;
  for (const range of ranges) {
    if (current && range[0] <= current[1] + 1) {
      current[1] = Math.max(current[1], range[1]);
      continue;
    }
    if (current) total += current[1] - current[0] + 1;
    current = [...range];
  }
  if (current) total += current[1] - current[0] + 1;
  return total;
}

/** Brilo stores the monthly rental, so revenue is prorated by covered days. */
export function revenueInRange(
  line: ContractLine,
  from: Date,
  to: Date,
): number {
  const range = clipToRange(line, from, to);
  if (!range) return 0;
  const days = range[1] - range[0] + 1;
  return (line.monthlyAmount * days) / AVG_DAYS_PER_MONTH;
}

export function rate(input: {
  revenue: number;
  monthlyCost: number | null;
  occupancyRate: number;
  months: number;
}): Rating {
  const { revenue, monthlyCost, occupancyRate, months } = input;

  if (monthlyCost != null && monthlyCost > 0) {
    const cost = monthlyCost * months;
    const roi = revenue / cost;
    const tier: ProfitabilityTier =
      roi >= ROI_TIERS.high
        ? 'HIGH'
        : roi >= ROI_TIERS.medium
          ? 'MEDIUM'
          : roi >= ROI_TIERS.low
            ? 'LOW'
            : 'CRITICAL';
    return {
      cost,
      profit: revenue - cost,
      margin: revenue > 0 ? (revenue - cost) / revenue : null,
      roi,
      score: Math.round(Math.min(roi / ROI_FOR_FULL_SCORE, 1) * 100),
      tier,
      basis: 'COST',
    };
  }

  const tier: ProfitabilityTier =
    occupancyRate >= OCCUPANCY_TIERS.high
      ? 'HIGH'
      : occupancyRate >= OCCUPANCY_TIERS.medium
        ? 'MEDIUM'
        : occupancyRate >= OCCUPANCY_TIERS.low
          ? 'LOW'
          : 'CRITICAL';
  return {
    cost: null,
    profit: null,
    margin: null,
    roi: null,
    score: Math.round(occupancyRate * 100),
    tier,
    basis: 'OCCUPANCY',
  };
}

export function monthlyBreakdown(
  lines: ContractLine[],
  period: Period,
): MonthBreakdown[] {
  const months: MonthBreakdown[] = [];
  let cursor = new Date(
    Date.UTC(period.from.getUTCFullYear(), period.from.getUTCMonth(), 1),
  );

  while (cursor <= period.to) {
    const monthEnd = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0),
    );
    const from = cursor < period.from ? period.from : cursor;
    const to = monthEnd > period.to ? period.to : monthEnd;
    const days = spanDays(from, to);
    months.push({
      month: `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`,
      occupancy: days > 0 ? occupiedDays(lines, from, to) / days : 0,
      revenue: lines.reduce(
        (sum, line) => sum + revenueInRange(line, from, to),
        0,
      ),
    });
    cursor = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
    );
  }
  return months;
}
