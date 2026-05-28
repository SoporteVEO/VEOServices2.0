import { Injectable } from '@nestjs/common';
import { OfferStatus, type Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const TOP_USERS_LIMIT = 25;
const TOP_BILLBOARDS_LIMIT = 20;
const TOP_CUSTOMERS_LIMIT = 15;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampPage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(Math.floor(value), 1);
}

function clampPageSize(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
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
  // `to` is exclusive, so we stop one day before.
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

export interface OffersOverviewFilters {
  from: Date;
  /** Exclusive upper bound. */
  to: Date;
  userId?: string | null;
}

export interface OffersOverviewListFilters extends OffersOverviewFilters {
  search?: string | null;
  page?: number;
  pageSize?: number;
}

export interface OffersStatusBreakdown {
  count: number;
  totalAmount: number;
  totalRental: number;
  totalImpression: number;
}

export interface OffersOverviewTotals {
  count: number;
  totalAmount: number;
  totalRental: number;
  totalImpression: number;
  uniqueCustomers: number;
  uniqueCreators: number;
  averageTicket: number;
  conversionRate: number;
  averageItemsPerOffer: number;
}

export interface OffersDailyPoint {
  dateKey: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  totalAmount: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
}

export interface OffersMonthlyPoint {
  monthKey: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  totalAmount: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
}

export interface OffersByUserRow {
  userId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  totalOffers: number;
  pendingCount: number;
  acceptedCount: number;
  declinedCount: number;
  totalAmount: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
}

export interface OffersTopBillboardRow {
  groupKey: string;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  occurrences: number;
  totalQuantity: number;
  totalAmount: number;
}

export interface OffersTopCustomerRow {
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  totalOffers: number;
  totalAmount: number;
  acceptedAmount: number;
}

export interface OffersOverview {
  range: { from: string; to: string };
  totals: OffersOverviewTotals;
  byStatus: {
    pending: OffersStatusBreakdown;
    accepted: OffersStatusBreakdown;
    declined: OffersStatusBreakdown;
  };
  daily: OffersDailyPoint[];
  monthly: OffersMonthlyPoint[];
  byUser: OffersByUserRow[];
  topBillboards: OffersTopBillboardRow[];
  topCustomers: OffersTopCustomerRow[];
}

export interface OffersOverviewListItem {
  id: string;
  offerNumber: string;
  status: OfferStatus;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  itemCount: number;
  totalRental: number;
  totalImpression: number;
  totalAmount: number;
  validUntil: string;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

export interface OffersOverviewList {
  data: OffersOverviewListItem[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class OffersAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(filters: OffersOverviewFilters): Promise<OffersOverview> {
    const { from, to, userId } = filters;

    const where: Prisma.OfferCreatedWhereInput = {
      createdAt: { gte: from, lt: to },
      ...(userId ? { createdByUserId: userId } : {}),
    };

    const [
      byStatus,
      daily,
      monthly,
      byUser,
      topBillboards,
      topCustomers,
      extras,
    ] = await Promise.all([
      this.aggregateByStatus(where),
      this.aggregateDaily(from, to, userId ?? null),
      this.aggregateMonthly(from, to, userId ?? null),
      this.aggregateByUser(where),
      this.aggregateTopBillboards(from, to, userId ?? null),
      this.aggregateTopCustomers(where),
      this.aggregateOverviewExtras(from, to, userId ?? null),
    ]);

    const totals = this.buildTotals(byStatus, byUser, extras);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals,
      byStatus,
      daily,
      monthly,
      byUser,
      topBillboards,
      topCustomers,
    };
  }

  async listOffers(
    filters: OffersOverviewListFilters,
  ): Promise<OffersOverviewList> {
    const page = clampPage(filters.page);
    const pageSize = clampPageSize(filters.pageSize);
    const search = filters.search?.trim();

    const where: Prisma.OfferCreatedWhereInput = {
      createdAt: { gte: filters.from, lt: filters.to },
      ...(filters.userId ? { createdByUserId: filters.userId } : {}),
      ...(search
        ? {
            OR: [
              { offerNumber: { contains: search, mode: 'insensitive' } },
              { customerName: { contains: search, mode: 'insensitive' } },
              { customerCompany: { contains: search, mode: 'insensitive' } },
              { customerEmail: { contains: search, mode: 'insensitive' } },
              { billingEmail: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.offerCreated.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.offerCreated.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        offerNumber: row.offerNumber,
        status: row.status,
        customerName: row.customerName,
        customerCompany: row.customerCompany,
        customerEmail: row.customerEmail,
        itemCount: row._count.items,
        totalRental: row.totalRental,
        totalImpression: row.totalImpression,
        totalAmount: round2(row.totalRental + row.totalImpression),
        validUntil: row.validUntil.toISOString(),
        createdAt: row.createdAt.toISOString(),
        createdBy: row.createdBy,
      })),
      total,
      page,
      pageSize,
    };
  }

  private async aggregateByStatus(
    where: Prisma.OfferCreatedWhereInput,
  ): Promise<OffersOverview['byStatus']> {
    const grouped = await this.prisma.offerCreated.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
      _sum: { totalRental: true, totalImpression: true },
    });

    const empty: OffersStatusBreakdown = {
      count: 0,
      totalAmount: 0,
      totalRental: 0,
      totalImpression: 0,
    };
    const byStatus: OffersOverview['byStatus'] = {
      pending: { ...empty },
      accepted: { ...empty },
      declined: { ...empty },
    };

    for (const row of grouped) {
      const totalRental = Number(row._sum?.totalRental ?? 0);
      const totalImpression = Number(row._sum?.totalImpression ?? 0);
      const breakdown: OffersStatusBreakdown = {
        count: row._count?._all ?? 0,
        totalRental: round2(totalRental),
        totalImpression: round2(totalImpression),
        totalAmount: round2(totalRental + totalImpression),
      };
      if (row.status === OfferStatus.PENDING) byStatus.pending = breakdown;
      else if (row.status === OfferStatus.ACCEPTED)
        byStatus.accepted = breakdown;
      else if (row.status === OfferStatus.DECLINED)
        byStatus.declined = breakdown;
    }

    return byStatus;
  }

  private async aggregateDaily(
    from: Date,
    to: Date,
    userId: string | null,
  ): Promise<OffersDailyPoint[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        date_key: string;
        status: OfferStatus;
        offer_count: bigint | number;
        total_rental: number | null;
        total_impression: number | null;
      }>
    >`
      SELECT
        to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date_key,
        "status",
        COUNT(*)::bigint AS offer_count,
        COALESCE(SUM("total_rental"), 0) AS total_rental,
        COALESCE(SUM("total_impression"), 0) AS total_impression
      FROM "offers_created"
      WHERE "createdAt" >= ${from}
        AND "createdAt" < ${to}
        AND (${userId}::text IS NULL OR "created_by_user_id" = ${userId})
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    const map = new Map<string, OffersDailyPoint>();
    for (const key of enumerateDayKeys(from, to)) {
      map.set(key, {
        dateKey: key,
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        totalAmount: 0,
        pendingAmount: 0,
        acceptedAmount: 0,
        declinedAmount: 0,
      });
    }

    for (const row of rows) {
      const point = map.get(row.date_key) ?? {
        dateKey: row.date_key,
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        totalAmount: 0,
        pendingAmount: 0,
        acceptedAmount: 0,
        declinedAmount: 0,
      };
      const count = Number(row.offer_count);
      const amount = round2(
        Number(row.total_rental ?? 0) + Number(row.total_impression ?? 0),
      );
      point.total += count;
      point.totalAmount = round2(point.totalAmount + amount);
      if (row.status === OfferStatus.PENDING) {
        point.pending += count;
        point.pendingAmount = round2(point.pendingAmount + amount);
      } else if (row.status === OfferStatus.ACCEPTED) {
        point.accepted += count;
        point.acceptedAmount = round2(point.acceptedAmount + amount);
      } else if (row.status === OfferStatus.DECLINED) {
        point.declined += count;
        point.declinedAmount = round2(point.declinedAmount + amount);
      }
      map.set(row.date_key, point);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );
  }

  private async aggregateMonthly(
    from: Date,
    to: Date,
    userId: string | null,
  ): Promise<OffersMonthlyPoint[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        month_key: string;
        status: OfferStatus;
        offer_count: bigint | number;
        total_rental: number | null;
        total_impression: number | null;
      }>
    >`
      SELECT
        to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month_key,
        "status",
        COUNT(*)::bigint AS offer_count,
        COALESCE(SUM("total_rental"), 0) AS total_rental,
        COALESCE(SUM("total_impression"), 0) AS total_impression
      FROM "offers_created"
      WHERE "createdAt" >= ${from}
        AND "createdAt" < ${to}
        AND (${userId}::text IS NULL OR "created_by_user_id" = ${userId})
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    const map = new Map<string, OffersMonthlyPoint>();
    for (const key of enumerateMonthKeys(from, to)) {
      map.set(key, {
        monthKey: key,
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        totalAmount: 0,
        pendingAmount: 0,
        acceptedAmount: 0,
        declinedAmount: 0,
      });
    }

    for (const row of rows) {
      const point = map.get(row.month_key) ?? {
        monthKey: row.month_key,
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        totalAmount: 0,
        pendingAmount: 0,
        acceptedAmount: 0,
        declinedAmount: 0,
      };
      const count = Number(row.offer_count);
      const amount = round2(
        Number(row.total_rental ?? 0) + Number(row.total_impression ?? 0),
      );
      point.total += count;
      point.totalAmount = round2(point.totalAmount + amount);
      if (row.status === OfferStatus.PENDING) {
        point.pending += count;
        point.pendingAmount = round2(point.pendingAmount + amount);
      } else if (row.status === OfferStatus.ACCEPTED) {
        point.accepted += count;
        point.acceptedAmount = round2(point.acceptedAmount + amount);
      } else if (row.status === OfferStatus.DECLINED) {
        point.declined += count;
        point.declinedAmount = round2(point.declinedAmount + amount);
      }
      map.set(row.month_key, point);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey),
    );
  }

  private async aggregateByUser(
    where: Prisma.OfferCreatedWhereInput,
  ): Promise<OffersByUserRow[]> {
    const grouped = await this.prisma.offerCreated.groupBy({
      by: ['createdByUserId', 'status'],
      where,
      _count: { _all: true },
      _sum: { totalRental: true, totalImpression: true },
    });

    if (grouped.length === 0) return [];

    const userIds = Array.from(
      new Set(grouped.map((row) => row.createdByUserId)),
    );
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const map = new Map<string, OffersByUserRow>();
    for (const row of grouped) {
      const userId = row.createdByUserId;
      const user = userById.get(userId);
      const totalRental = Number(row._sum?.totalRental ?? 0);
      const totalImpression = Number(row._sum?.totalImpression ?? 0);
      const amount = round2(totalRental + totalImpression);
      const count = row._count?._all ?? 0;

      const existing = map.get(userId) ?? {
        userId,
        firstName: user?.firstName ?? "—",
        lastName: user?.lastName ?? null,
        email: user?.email ?? "—",
        totalOffers: 0,
        pendingCount: 0,
        acceptedCount: 0,
        declinedCount: 0,
        totalAmount: 0,
        pendingAmount: 0,
        acceptedAmount: 0,
        declinedAmount: 0,
      };

      existing.totalOffers += count;
      existing.totalAmount = round2(existing.totalAmount + amount);
      if (row.status === OfferStatus.PENDING) {
        existing.pendingCount += count;
        existing.pendingAmount = round2(existing.pendingAmount + amount);
      } else if (row.status === OfferStatus.ACCEPTED) {
        existing.acceptedCount += count;
        existing.acceptedAmount = round2(existing.acceptedAmount + amount);
      } else if (row.status === OfferStatus.DECLINED) {
        existing.declinedCount += count;
        existing.declinedAmount = round2(existing.declinedAmount + amount);
      }
      map.set(userId, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, TOP_USERS_LIMIT);
  }

  private async aggregateTopBillboards(
    from: Date,
    to: Date,
    userId: string | null,
  ): Promise<OffersTopBillboardRow[]> {
    type Row = {
      group_key: string;
      billboard_code: string | null;
      address: string | null;
      city_name: string | null;
      department_name: string | null;
      occurrences: bigint | number;
      total_quantity: bigint | number | null;
      total_amount: number | null;
    };

    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        COALESCE(item."billboard_code", item."address", '—') AS group_key,
        item."billboard_code"     AS billboard_code,
        item."address"            AS address,
        item."city_name"          AS city_name,
        item."department_name"    AS department_name,
        COUNT(*)::bigint          AS occurrences,
        COALESCE(SUM(item."quantity"), 0)::bigint AS total_quantity,
        COALESCE(
          SUM(
            (item."impression_price" + item."rental_price") * item."quantity"
          ),
          0
        ) AS total_amount
      FROM "offers_created_items" item
      INNER JOIN "offers_created" offer
        ON offer."id" = item."offer_id"
      WHERE offer."createdAt" >= ${from}
        AND offer."createdAt" < ${to}
        AND (${userId}::text IS NULL OR offer."created_by_user_id" = ${userId})
      GROUP BY 1, 2, 3, 4, 5
      ORDER BY total_amount DESC
      LIMIT ${TOP_BILLBOARDS_LIMIT}
    `;

    return rows.map((row) => ({
      groupKey: row.group_key,
      billboardCode: row.billboard_code,
      address: row.address,
      cityName: row.city_name,
      departmentName: row.department_name,
      occurrences: Number(row.occurrences),
      totalQuantity: Number(row.total_quantity ?? 0),
      totalAmount: round2(Number(row.total_amount ?? 0)),
    }));
  }

  private async aggregateTopCustomers(
    where: Prisma.OfferCreatedWhereInput,
  ): Promise<OffersTopCustomerRow[]> {
    const rows = await this.prisma.offerCreated.groupBy({
      by: ['customerName', 'customerCompany', 'customerEmail'],
      where,
      _count: { _all: true },
      _sum: { totalRental: true, totalImpression: true },
      orderBy: [
        { _sum: { totalRental: 'desc' } },
        { _sum: { totalImpression: 'desc' } },
      ],
      take: TOP_CUSTOMERS_LIMIT * 4,
    });

    if (rows.length === 0) return [];

    const acceptedRows = await this.prisma.offerCreated.groupBy({
      by: ['customerName', 'customerCompany', 'customerEmail'],
      where: { ...where, status: OfferStatus.ACCEPTED },
      _sum: { totalRental: true, totalImpression: true },
    });

    function customerKey(row: {
      customerName: string;
      customerCompany: string | null;
      customerEmail: string | null;
    }): string {
      return [
        row.customerName ?? '',
        row.customerCompany ?? '',
        row.customerEmail ?? '',
      ].join('|');
    }

    const acceptedByCustomer = new Map<string, number>();
    for (const row of acceptedRows) {
      const amount = round2(
        Number(row._sum?.totalRental ?? 0) +
          Number(row._sum?.totalImpression ?? 0),
      );
      acceptedByCustomer.set(customerKey(row), amount);
    }

    const mapped = rows.map((row) => {
      const totalRental = Number(row._sum?.totalRental ?? 0);
      const totalImpression = Number(row._sum?.totalImpression ?? 0);
      const totalAmount = round2(totalRental + totalImpression);
      return {
        customerName: row.customerName,
        customerCompany: row.customerCompany,
        customerEmail: row.customerEmail,
        totalOffers: row._count?._all ?? 0,
        totalAmount,
        acceptedAmount: acceptedByCustomer.get(customerKey(row)) ?? 0,
      };
    });

    return mapped
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, TOP_CUSTOMERS_LIMIT);
  }

  private async aggregateOverviewExtras(
    from: Date,
    to: Date,
    userId: string | null,
  ): Promise<{
    uniqueCustomers: number;
    uniqueCreators: number;
    totalItems: number;
  }> {
    type ExtrasRow = {
      unique_customers: bigint | number;
      unique_creators: bigint | number;
      total_items: bigint | number | null;
    };

    const rows = await this.prisma.$queryRaw<ExtrasRow[]>`
      SELECT
        COUNT(
          DISTINCT COALESCE(NULLIF(offer."customer_email", ''), offer."customer_name")
        )::bigint AS unique_customers,
        COUNT(DISTINCT offer."created_by_user_id")::bigint AS unique_creators,
        COALESCE(SUM(item_counts.item_count), 0)::bigint  AS total_items
      FROM "offers_created" offer
      LEFT JOIN (
        SELECT "offer_id", COUNT(*)::bigint AS item_count
        FROM "offers_created_items"
        GROUP BY "offer_id"
      ) item_counts ON item_counts."offer_id" = offer."id"
      WHERE offer."createdAt" >= ${from}
        AND offer."createdAt" < ${to}
        AND (${userId}::text IS NULL OR offer."created_by_user_id" = ${userId})
    `;

    const row = rows[0];
    return {
      uniqueCustomers: Number(row?.unique_customers ?? 0),
      uniqueCreators: Number(row?.unique_creators ?? 0),
      totalItems: Number(row?.total_items ?? 0),
    };
  }

  private buildTotals(
    byStatus: OffersOverview['byStatus'],
    byUser: OffersByUserRow[],
    extras: {
      uniqueCustomers: number;
      uniqueCreators: number;
      totalItems: number;
    },
  ): OffersOverviewTotals {
    const count =
      byStatus.pending.count +
      byStatus.accepted.count +
      byStatus.declined.count;
    const totalRental = round2(
      byStatus.pending.totalRental +
        byStatus.accepted.totalRental +
        byStatus.declined.totalRental,
    );
    const totalImpression = round2(
      byStatus.pending.totalImpression +
        byStatus.accepted.totalImpression +
        byStatus.declined.totalImpression,
    );
    const totalAmount = round2(totalRental + totalImpression);
    const averageTicket = count > 0 ? round2(totalAmount / count) : 0;
    const conversionRate =
      count > 0 ? Math.round((byStatus.accepted.count / count) * 1000) / 10 : 0;
    const averageItemsPerOffer =
      count > 0 ? Math.round((extras.totalItems / count) * 100) / 100 : 0;

    // Prefer the SQL distinct count; fall back to byUser when unavailable.
    const uniqueCreators =
      extras.uniqueCreators > 0 ? extras.uniqueCreators : byUser.length;

    return {
      count,
      totalAmount,
      totalRental,
      totalImpression,
      uniqueCustomers: extras.uniqueCustomers,
      uniqueCreators,
      averageTicket,
      conversionRate,
      averageItemsPerOffer,
    };
  }
}
