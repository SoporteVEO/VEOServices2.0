import {
  monthlyBreakdown,
  occupiedDays,
  rate,
  resolvePeriod,
  revenueInRange,
  type ContractLine,
} from './expansion-profitability';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const line = (
  start: string,
  end: string,
  monthlyAmount = 600,
): ContractLine => ({
  billboardId: 1,
  contractCode: 'CON0001/26',
  customerName: 'Cliente',
  startDate: day(start),
  endDate: day(end),
  monthlyAmount,
});

describe('expansion profitability', () => {
  it('resolves the trailing 12 months ending today', () => {
    const period = resolvePeriod(null, new Date('2026-11-04T15:00:00Z'));
    expect(period.from.toISOString().slice(0, 10)).toBe('2025-11-05');
    expect(period.to.toISOString().slice(0, 10)).toBe('2026-11-04');
    expect(period.days).toBe(365);
  });

  it('cuts the current year at today', () => {
    const period = resolvePeriod(2026, new Date('2026-11-04T15:00:00Z'));
    expect(period.to.toISOString().slice(0, 10)).toBe('2026-11-04');
    expect(period.label).toBe('2026 (a la fecha)');
    expect(resolvePeriod(2025, new Date('2026-11-04')).days).toBe(365);
  });

  it('counts overlapping and adjacent contracts once', () => {
    const from = day('2026-01-01');
    const to = day('2026-12-31');
    const lines = [
      line('2026-01-01', '2026-01-31'),
      line('2026-01-15', '2026-02-10'),
      line('2026-02-11', '2026-02-28'),
      line('2025-06-01', '2025-12-31'),
    ];
    expect(occupiedDays(lines, from, to)).toBe(59);
  });

  it('prorates the monthly rental by the days inside the range', () => {
    const revenue = revenueInRange(
      line('2025-12-01', '2026-12-31', 365.25 / 12),
      day('2026-01-01'),
      day('2026-01-10'),
    );
    expect(revenue).toBeCloseTo(10);
  });

  it('rates by revenue over cost once the cost is known', () => {
    const good = rate({
      revenue: 6000,
      monthlyCost: 200,
      occupancyRate: 10 / 12,
      months: 12,
    });
    expect(good).toMatchObject({ basis: 'COST', tier: 'HIGH', cost: 2400 });
    expect(good.roi).toBeCloseTo(2.5);

    const losing = rate({
      revenue: 1000,
      monthlyCost: 200,
      occupancyRate: 0.2,
      months: 12,
    });
    expect(losing.tier).toBe('CRITICAL');
    expect(losing.profit).toBe(-1400);
  });

  it('falls back to occupancy without a cost', () => {
    expect(
      rate({ revenue: 0, monthlyCost: null, occupancyRate: 0.6, months: 12 }),
    ).toMatchObject({ basis: 'OCCUPANCY', tier: 'MEDIUM', score: 60 });
  });

  it('breaks the period down by calendar month', () => {
    const period = resolvePeriod(2025, new Date('2026-11-04'));
    const months = monthlyBreakdown([line('2025-03-01', '2025-04-30')], period);
    expect(months).toHaveLength(12);
    expect(months[2]).toMatchObject({ month: '2025-03', occupancy: 1 });
    expect(months[4].occupancy).toBe(0);
  });
});
