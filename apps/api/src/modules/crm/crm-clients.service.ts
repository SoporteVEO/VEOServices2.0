import { Injectable, NotFoundException } from '@nestjs/common';
import type { ClientType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  OFFER_SUMMARY_SELECT,
  serializeOffer,
  type CrmOfferSummary,
} from './crm-deals.service.js';

export interface CrmClientRow {
  id: string;
  type: ClientType;
  name: string;
  company: string | null;
  email: string | null;
  contact: string | null;
  contactsCount: number;
  openDeals: number;
  openValue: number;
  wonValue: number;
  offersCount: number;
  lastActivityAt: string | null;
}

export interface PaginatedCrmClients {
  data: CrmClientRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CrmClientSummary {
  client: {
    id: string;
    type: ClientType;
    name: string;
    company: string | null;
    email: string | null;
    billingEmail: string | null;
    contact: string | null;
    createdAt: string;
  };
  stats: {
    openDeals: number;
    openValue: number;
    wonDeals: number;
    wonValue: number;
    lostDeals: number;
    offersCount: number;
    offersAccepted: number;
    offersTotal: number;
    lastActivityAt: string | null;
  };
  offers: CrmOfferSummary[];
}

@Injectable()
export class CrmClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    search?: string;
    page?: string;
    pageSize?: string;
    withOpenDeals?: string;
    type?: string;
  }): Promise<PaginatedCrmClients> {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 25, 1), 100);
    const where: Prisma.ClientWhereInput = {};
    const term = params.search?.trim();
    if (term) {
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { company: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        {
          crmContacts: {
            some: { firstName: { contains: term, mode: 'insensitive' } },
          },
        },
      ];
    }
    if (params.withOpenDeals === 'true')
      where.crmDeals = { some: { status: 'OPEN' } };
    if (params.type === 'DIRECT' || params.type === 'AGENCY')
      where.type = params.type;

    const [rows, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          name: true,
          company: true,
          email: true,
          contact: true,
          _count: { select: { crmContacts: true, offers: true } },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

    const ids = rows.map((r) => r.id);
    const [dealGroups, activityGroups] = ids.length
      ? await Promise.all([
          this.prisma.crmDeal.groupBy({
            by: ['clientId', 'status'],
            where: { clientId: { in: ids }, status: { in: ['OPEN', 'WON'] } },
            _count: { _all: true },
            _sum: { value: true },
          }),
          this.prisma.crmActivity.groupBy({
            by: ['clientId'],
            where: { clientId: { in: ids } },
            _max: { occurredAt: true },
          }),
        ])
      : [[], []];

    return {
      total,
      page,
      pageSize,
      data: rows.map((row) => {
        const open = dealGroups.find(
          (g) => g.clientId === row.id && g.status === 'OPEN',
        );
        const won = dealGroups.find(
          (g) => g.clientId === row.id && g.status === 'WON',
        );
        const last = activityGroups.find((g) => g.clientId === row.id)?._max
          .occurredAt;
        return {
          id: row.id,
          type: row.type,
          name: row.name,
          company: row.company,
          email: row.email,
          contact: row.contact,
          contactsCount: row._count.crmContacts,
          offersCount: row._count.offers,
          openDeals: open?._count._all ?? 0,
          openValue: open?._sum.value ?? 0,
          wonValue: won?._sum.value ?? 0,
          lastActivityAt: last?.toISOString() ?? null,
        };
      }),
    };
  }

  async summary(clientId: string): Promise<CrmClientSummary> {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const [dealGroups, offers, lastActivity] = await Promise.all([
      this.prisma.crmDeal.groupBy({
        by: ['status'],
        where: { clientId },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.offerCreated.findMany({
        where: { clientId },
        select: OFFER_SUMMARY_SELECT,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.crmActivity.findFirst({
        where: { clientId },
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true },
      }),
    ]);
    const group = (status: string) =>
      dealGroups.find((g) => g.status === status);
    const serializedOffers = offers.map(serializeOffer);

    return {
      client: {
        id: client.id,
        type: client.type,
        name: client.name,
        company: client.company,
        email: client.email,
        billingEmail: client.billingEmail,
        contact: client.contact,
        createdAt: client.createdAt.toISOString(),
      },
      stats: {
        openDeals: group('OPEN')?._count._all ?? 0,
        openValue: group('OPEN')?._sum.value ?? 0,
        wonDeals: group('WON')?._count._all ?? 0,
        wonValue: group('WON')?._sum.value ?? 0,
        lostDeals: group('LOST')?._count._all ?? 0,
        offersCount: serializedOffers.length,
        offersAccepted: serializedOffers.filter((o) => o.status === 'ACCEPTED')
          .length,
        offersTotal: serializedOffers
          .filter((o) => o.status === 'ACCEPTED')
          .reduce((acc, o) => acc + o.total, 0),
        lastActivityAt: lastActivity?.occurredAt.toISOString() ?? null,
      },
      offers: serializedOffers,
    };
  }
}
