import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OfferItemType, OfferStatus, type Prisma } from '@prisma/client';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { CreateOfferDto, CreateOfferItemDto } from './dto/create-offer.dto.js';
import type { ListBriloContractsFilters } from './dto/list-brilo-contracts-query.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';

const DEFAULT_TAX_RATE = 0.13;
const OFFER_PDF_FOLDER = 'offers';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const BRILO_CONTRACTS_PAGE_SIZE = 30;

const BRILO_CONTRACTS_PAGE_SQL = `
SELECT
    maecon.mconId,
    maecon.mconCodigo,
    maecon.mconFecha,
    ej.ejecNombre,
    COUNT(*) OVER () AS totalCount
FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
LEFT JOIN olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
    ON ej.ejecId = maecon.ejecId
WHERE maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
  AND (
      @Search = ''
      OR maecon.mconCodigo LIKE @SearchLike ESCAPE '\\'
      OR ej.ejecNombre LIKE @SearchLike ESCAPE '\\'
  )
ORDER BY maecon.mconFecha DESC, maecon.mconId DESC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
`;

interface BriloContractRow {
  mconId: number;
  mconCodigo: string;
  mconFecha: Date;
  ejecNombre: string | null;
  totalCount: number;
}

const BRILO_CONTRACT_BY_ID_SQL = `
SELECT
    maecon.mconId,
    maecon.mconCodigo,
    maecon.mconFecha,
    ej.ejecNombre
FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
LEFT JOIN olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
    ON ej.ejecId = maecon.ejecId
WHERE maecon.mconId = @MconId
  AND maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
`;

export interface OfferListItem {
  id: string;
  offerNumber: string;
  clientId: string | null;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  customerBillingEmail: string | null;
  customerContact: string | null;
  validUntil: string;
  specialConditions: string | null;
  advisorFullName: string | null;
  status: OfferStatus;
  briloMconId: number | null;
  subtotalImpression: number;
  ivaImpression: number;
  totalImpression: number;
  subtotalRental: number;
  ivaRental: number;
  totalRental: number;
  itemCount: number;
  hasPdf: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

export interface BriloContractOption {
  mconId: number;
  mconCodigo: string;
  mconFecha: string;
  ejecNombre: string | null;
}

export interface PaginatedBriloContracts {
  data: BriloContractOption[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OfferDetailItem {
  id: string;
  itemType: OfferItemType;
  billboardId: number | null;
  billboardCode: string | null;
  address: string | null;
  cityName: string | null;
  departmentName: string | null;
  width: number | null;
  height: number | null;
  quantity: number;
  impressionPrice: number;
  rentalPrice: number;
  taxRate: number;
  description: string | null;
  digitalBillboardId: string | null;
  spotCount: number | null;
  startDate: string | null;
  endDate: string | null;
}

export interface OfferDetail extends OfferListItem {
  items: OfferDetailItem[];
  linkedBriloContract: BriloContractOption | null;
}

export interface ListOffersFilters {
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface PaginatedOffers {
  data: OfferListItem[];
  nextCursor: string | null;
}

export interface PaginatedOffersPage {
  data: OfferListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListMineOffersFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MyOffersSummaryFilters {
  from: Date;
  to: Date;
}

export interface MyOffersStatusBreakdown {
  count: number;
  totalRental: number;
  totalImpression: number;
}

export interface MyOffersTrendPoint {
  monthKey: string;
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  pendingAmount: number;
  acceptedAmount: number;
  declinedAmount: number;
}

export interface MyOffersSummary {
  range: { from: string; to: string };
  totals: {
    count: number;
    totalRental: number;
    totalImpression: number;
  };
  byStatus: {
    pending: MyOffersStatusBreakdown;
    accepted: MyOffersStatusBreakdown;
    declined: MyOffersStatusBreakdown;
  };
  trend: MyOffersTrendPoint[];
}

function clampPage(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(Math.floor(value), 1);
}

function clampLimit(value: number | undefined): number {
  if (!value || !Number.isFinite(value)) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(Math.floor(value), 1), MAX_PAGE_SIZE);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function decodeBase64Pdf(base64: string): Buffer {
  const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
  if (!normalized) {
    throw new BadRequestException('El PDF está vacío o es inválido');
  }
  const buffer = Buffer.from(normalized, 'base64');
  if (buffer.length < 4 || buffer.subarray(0, 4).toString('ascii') !== '%PDF') {
    throw new BadRequestException('El archivo no es un PDF válido');
  }
  return buffer;
}

@Injectable()
export class OffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: S3StorageService,
    private readonly clients: ClientsService,
    private readonly brilo: BriloDatabaseService,
  ) {}

  async create(
    dto: CreateOfferDto,
    createdByUserId: string,
  ): Promise<OfferListItem> {
    if (!createdByUserId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const validUntil = new Date(dto.validUntil);
    if (Number.isNaN(validUntil.getTime())) {
      throw new BadRequestException('Vigencia de oferta inválida');
    }

    this.validateItems(dto.items);

    const totals = computeOfferTotals(dto.items);
    const {
      subtotalImpression,
      subtotalRental,
      ivaImpression,
      ivaRental,
      totalImpression,
      totalRental,
    } = totals;

    const advisorFullName = await this.resolveAdvisorFullName(createdByUserId);
    const clientId = await this.resolveClientId(dto);

    // If a PDF is provided up-front, upload it before persisting. Otherwise,
    // the client will attach it via `attachPdf` once it knows the real offer
    // number (see `PATCH /offers/:id/pdf`).
    const uploadedKey = dto.pdfBase64
      ? (
          await this.storage.uploadBuffer({
            buffer: decodeBase64Pdf(dto.pdfBase64),
            mimeType: 'application/pdf',
            extension: 'pdf',
            folder: OFFER_PDF_FOLDER,
          })
        ).key
      : null;

    const maxCreateAttempts = 3;
    for (let attempt = 1; attempt <= maxCreateAttempts; attempt++) {
      const offerNumber = await this.generateOfferNumber();
      try {
        const created = await this.prisma.offerCreated.create({
          data: {
            offerNumber,
            clientId,
            customerName: dto.customerName.trim(),
            customerCompany: dto.customerCompany?.trim() || null,
            customerEmail: dto.customerEmail?.trim().toLowerCase() || null,
            billingEmail:
              dto.customerBillingEmail?.trim().toLowerCase() || null,
            customerContact: dto.customerContact?.trim() || null,
            validUntil,
            specialConditions: dto.specialConditions?.trim() || null,
            advisorFullName,
            subtotalImpression,
            ivaImpression,
            totalImpression,
            subtotalRental,
            ivaRental,
            totalRental,
            pdfS3Key: uploadedKey,
            createdByUserId,
            items: {
              create: dto.items.map((item) => ({
                itemType: item.itemType ?? OfferItemType.STATIC_BILLBOARD,
                billboardId: item.billboardId ?? null,
                billboardCode: item.billboardCode ?? null,
                address: item.address ?? null,
                cityName: item.cityName ?? null,
                departmentName: item.departmentName ?? null,
                width: item.width ?? null,
                height: item.height ?? null,
                quantity: item.quantity,
                impressionPrice: item.impressionPrice,
                rentalPrice: item.rentalPrice,
                taxRate: item.taxRate ?? DEFAULT_TAX_RATE,
                description: item.description?.trim() || null,
                digitalBillboardId: item.digitalBillboardId ?? null,
                spotCount: item.spotCount ?? null,
                startDate: item.startDate ? new Date(item.startDate) : null,
                endDate: item.endDate ? new Date(item.endDate) : null,
              })),
            },
          },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: { select: { items: true } },
          },
        });

        return this.mapToListItem(created);
      } catch (e) {
        const isUniqueConflict =
          typeof e === 'object' &&
          e !== null &&
          'code' in e &&
          (e as { code: string }).code === 'P2002';

        if (isUniqueConflict && attempt < maxCreateAttempts) {
          continue;
        }

        if (uploadedKey) {
          await this.storage.deleteByKey(uploadedKey);
        }
        if (isUniqueConflict) {
          throw new ConflictException(
            'Se generó un número de cotización duplicado, intenta de nuevo.',
          );
        }
        throw e;
      }
    }

    if (uploadedKey) {
      await this.storage.deleteByKey(uploadedKey);
    }
    throw new ConflictException(
      'Se generó un número de cotización duplicado, intenta de nuevo.',
    );
  }

  /**
   * Uploads (or replaces) the PDF associated with an existing offer. Called
   * by the client after it generates the document with the real offer
   * number returned by `create`.
   */
  async attachPdf(id: string, pdfBase64: string): Promise<OfferListItem> {
    const offer = await this.prisma.offerCreated.findUnique({
      where: { id },
      select: { id: true, pdfS3Key: true },
    });
    if (!offer) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const buffer = decodeBase64Pdf(pdfBase64);
    const upload = await this.storage.uploadBuffer({
      buffer,
      mimeType: 'application/pdf',
      extension: 'pdf',
      folder: OFFER_PDF_FOLDER,
    });

    try {
      const updated = await this.prisma.offerCreated.update({
        where: { id },
        data: { pdfS3Key: upload.key },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { items: true } },
        },
      });

      // Best-effort: delete the previous PDF in the background.
      if (offer.pdfS3Key && offer.pdfS3Key !== upload.key) {
        void this.storage.deleteByKey(offer.pdfS3Key);
      }

      return this.mapToListItem(updated);
    } catch (e) {
      await this.storage.deleteByKey(upload.key);
      throw e;
    }
  }

  /**
   * Returns the advisor full name from the user's team member record, or
   * falls back to the user's own first/last name when no team member exists.
   */
  private async resolveAdvisorFullName(
    createdByUserId: string,
  ): Promise<string | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: { userId: createdByUserId },
      select: { fullName: true },
    });
    if (member?.fullName?.trim()) return member.fullName.trim();

    const user = await this.prisma.user.findUnique({
      where: { id: createdByUserId },
      select: { firstName: true, lastName: true },
    });
    if (!user) return null;
    const composed = [user.firstName, user.lastName]
      .filter((p) => Boolean(p && p.trim()))
      .join(' ')
      .trim();
    return composed || null;
  }

  /**
   * Resolves the client id to link with the offer. Priority:
   * 1. Explicit `clientId` in the DTO (validated to exist).
   * 2. Idempotent upsert by `customerEmail` when present.
   * 3. Otherwise `null` (anonymous customer).
   */
  private async resolveClientId(dto: CreateOfferDto): Promise<string | null> {
    if (dto.clientId) {
      const existing = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException('Cliente no encontrado');
      }
      return existing.id;
    }

    const email = dto.customerEmail?.trim();
    if (!email) return null;

    const client = await this.clients.upsertByEmail({
      name: dto.customerName,
      company: dto.customerCompany ?? null,
      email,
      billingEmail: dto.customerBillingEmail ?? null,
      contact: dto.customerContact ?? null,
    });
    return client.id;
  }

  async list(filters: ListOffersFilters = {}): Promise<PaginatedOffers> {
    const limit = clampLimit(filters.limit);
    const search = filters.search?.trim();

    const where: Prisma.OfferCreatedWhereInput = search
      ? {
          OR: [
            { offerNumber: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { customerCompany: { contains: search, mode: 'insensitive' } },
            { customerEmail: { contains: search, mode: 'insensitive' } },
            { billingEmail: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const rows = await this.prisma.offerCreated.findMany({
      where,
      take: limit + 1,
      ...(filters.cursor ? { skip: 1, cursor: { id: filters.cursor } } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { items: true } },
      },
    });

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && pageRows.length > 0 ? pageRows[pageRows.length - 1].id : null;

    return {
      data: pageRows.map((row) => this.mapToListItem(row)),
      nextCursor,
    };
  }

  async listMine(
    userId: string,
    filters: ListMineOffersFilters = {},
  ): Promise<PaginatedOffersPage> {
    const page = clampPage(filters.page);
    const pageSize = clampLimit(filters.pageSize);
    const search = filters.search?.trim();
    const skip = (page - 1) * pageSize;

    const where: Prisma.OfferCreatedWhereInput = {
      createdByUserId: userId,
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
        skip,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
      data: rows.map((row) => this.mapToListItem(row)),
      total,
      page,
      pageSize,
    };
  }

  async getMyOffersSummary(
    userId: string,
    filters: MyOffersSummaryFilters,
  ): Promise<MyOffersSummary> {
    const { from, to } = filters;

    const grouped = await this.prisma.offerCreated.groupBy({
      by: ['status'],
      where: {
        createdByUserId: userId,
        createdAt: { gte: from, lt: to },
      },
      _count: { _all: true },
      _sum: { totalRental: true, totalImpression: true },
    });

    const emptyBreakdown: MyOffersStatusBreakdown = {
      count: 0,
      totalRental: 0,
      totalImpression: 0,
    };
    const byStatus: MyOffersSummary['byStatus'] = {
      pending: { ...emptyBreakdown },
      accepted: { ...emptyBreakdown },
      declined: { ...emptyBreakdown },
    };

    for (const row of grouped) {
      const breakdown: MyOffersStatusBreakdown = {
        count: row._count?._all ?? 0,
        totalRental: Number(row._sum?.totalRental ?? 0),
        totalImpression: Number(row._sum?.totalImpression ?? 0),
      };
      if (row.status === OfferStatus.PENDING) byStatus.pending = breakdown;
      else if (row.status === OfferStatus.ACCEPTED)
        byStatus.accepted = breakdown;
      else if (row.status === OfferStatus.DECLINED)
        byStatus.declined = breakdown;
    }

    const totals = {
      count:
        byStatus.pending.count +
        byStatus.accepted.count +
        byStatus.declined.count,
      totalRental: round2(
        byStatus.pending.totalRental +
          byStatus.accepted.totalRental +
          byStatus.declined.totalRental,
      ),
      totalImpression: round2(
        byStatus.pending.totalImpression +
          byStatus.accepted.totalImpression +
          byStatus.declined.totalImpression,
      ),
    };

    const trend = await this.fetchMyOffersTrend(userId, from, to);

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      totals,
      byStatus,
      trend,
    };
  }

  private async fetchMyOffersTrend(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<MyOffersTrendPoint[]> {
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
        "status" AS status,
        COUNT(*)::bigint AS offer_count,
        COALESCE(SUM("total_rental"), 0) AS total_rental,
        COALESCE(SUM("total_impression"), 0) AS total_impression
      FROM "offers_created"
      WHERE "created_by_user_id" = ${userId}
        AND "createdAt" >= ${from}
        AND "createdAt" < ${to}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `;

    const map = new Map<string, MyOffersTrendPoint>();
    const monthKeys = enumerateMonthKeys(from, to);
    for (const key of monthKeys) {
      map.set(key, {
        monthKey: key,
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        pendingAmount: 0,
        acceptedAmount: 0,
        declinedAmount: 0,
      });
    }

    for (const row of rows) {
      const key = row.month_key;
      let point = map.get(key);
      if (!point) {
        point = {
          monthKey: key,
          total: 0,
          pending: 0,
          accepted: 0,
          declined: 0,
          pendingAmount: 0,
          acceptedAmount: 0,
          declinedAmount: 0,
        };
        map.set(key, point);
      }
      const count = Number(row.offer_count);
      const amount = round2(
        Number(row.total_rental ?? 0) + Number(row.total_impression ?? 0),
      );
      point.total += count;
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
    }

    return Array.from(map.values()).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey),
    );
  }

  async listBriloContracts(
    filters: ListBriloContractsFilters = {},
  ): Promise<PaginatedBriloContracts> {
    const page = clampPage(filters.page);
    const pageSize = clampLimit(filters.pageSize ?? BRILO_CONTRACTS_PAGE_SIZE);
    const search = filters.search?.trim() ?? '';
    const searchLike = `%${escapeLikePattern(search)}%`;
    const offset = (page - 1) * pageSize;

    const rows = await this.brilo.query<BriloContractRow>(
      BRILO_CONTRACTS_PAGE_SQL,
      {
        Search: search,
        SearchLike: searchLike,
        Offset: offset,
        PageSize: pageSize,
      },
    );

    const total = rows[0]?.totalCount ?? 0;

    return {
      data: rows.map((row) => ({
        mconId: row.mconId,
        mconCodigo: row.mconCodigo,
        mconFecha: row.mconFecha.toISOString(),
        ejecNombre: row.ejecNombre,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getOfferById(id: string, userId: string): Promise<OfferDetail> {
    await this.findOwnedOffer(id, userId);

    const row = await this.prisma.offerCreated.findUnique({
      where: { id },
      include: {
        ...this.offerListInclude(),
        items: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!row) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const linkedBriloContract = row.briloMconId
      ? await this.fetchBriloContractById(row.briloMconId)
      : null;

    return this.mapToDetail(row, linkedBriloContract);
  }

  async updateOffer(
    id: string,
    userId: string,
    dto: UpdateOfferDto,
  ): Promise<OfferDetail> {
    const existing = await this.findOwnedOffer(id, userId);

    if (dto.status === OfferStatus.ACCEPTED) {
      if (!dto.briloMconId) {
        throw new BadRequestException(
          'Debes vincular un contrato de Brilo para marcar la cotización como aceptada',
        );
      }
      await this.assertBriloContractExists(dto.briloMconId);
    }

    const wasAccepted = existing.status === OfferStatus.ACCEPTED;
    const willBeAccepted = dto.status === OfferStatus.ACCEPTED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.offerCreated.update({
        where: { id },
        data: {
          status: dto.status,
          briloMconId: willBeAccepted ? dto.briloMconId! : null,
        },
        include: {
          ...this.offerListInclude(),
          items: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (wasAccepted && !willBeAccepted) {
        await this.removeDigitalUsagesForOffer(tx, id);
      } else if (!wasAccepted && willBeAccepted) {
        await this.registerDigitalUsagesForOffer(tx, id);
      }

      return row;
    });

    const linkedBriloContract = updated.briloMconId
      ? await this.fetchBriloContractById(updated.briloMconId)
      : null;

    return this.mapToDetail(updated, linkedBriloContract);
  }

  async declineOffer(id: string, userId: string): Promise<OfferListItem> {
    const offer = await this.findOwnedOffer(id, userId);
    if (offer.status === OfferStatus.DECLINED) {
      throw new BadRequestException('La cotización ya está rechazada');
    }

    const wasAccepted = offer.status === OfferStatus.ACCEPTED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.offerCreated.update({
        where: { id },
        data: {
          status: OfferStatus.DECLINED,
          briloMconId: null,
        },
        include: this.offerListInclude(),
      });

      if (wasAccepted) {
        await this.removeDigitalUsagesForOffer(tx, id);
      }

      return row;
    });

    return this.mapToListItem(updated);
  }

  async acceptOffer(
    id: string,
    userId: string,
    briloMconId: number,
  ): Promise<OfferListItem> {
    const offer = await this.findOwnedOffer(id, userId);
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException(
        'Solo se pueden aceptar cotizaciones pendientes',
      );
    }

    await this.assertBriloContractExists(briloMconId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.offerCreated.update({
        where: { id },
        data: {
          status: OfferStatus.ACCEPTED,
          briloMconId,
        },
        include: this.offerListInclude(),
      });

      await this.registerDigitalUsagesForOffer(tx, id);

      return row;
    });

    return this.mapToListItem(updated);
  }

  async getDownloadUrl(
    id: string,
    requestUserId?: string,
  ): Promise<{ url: string }> {
    const row = await this.prisma.offerCreated.findUnique({
      where: { id },
      select: { pdfS3Key: true, createdByUserId: true },
    });
    if (!row) throw new NotFoundException('Cotización no encontrada');
    if (requestUserId && row.createdByUserId !== requestUserId) {
      throw new NotFoundException('Cotización no encontrada');
    }
    if (!row.pdfS3Key) {
      throw new NotFoundException('La cotización no tiene PDF asociado');
    }
    const url = await this.storage.getSignedUrl(row.pdfS3Key);
    return { url };
  }

  private async generateOfferNumber(): Promise<string> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const yearSuffix = String(now.getFullYear()).slice(-2);
    const numberPattern = `^COT[0-9]+/${yearSuffix}$`;
    const rows = await this.prisma.$queryRaw<
      Array<{ max_sequence: number | null }>
    >`
      SELECT MAX(
        CASE
          WHEN "offer_number" ~ ${numberPattern}
          THEN CAST(
            SUBSTRING(
              "offer_number"
              FROM 4
              FOR POSITION('/' IN "offer_number") - 4
            ) AS INTEGER
          )
          ELSE NULL
        END
      ) AS max_sequence
      FROM "offers_created"
      WHERE "createdAt" >= ${yearStart}
        AND "createdAt" < ${yearEnd}
    `;

    const maxSequence = Number(rows[0]?.max_sequence ?? 0);
    const sequence = String(maxSequence + 1).padStart(4, '0');
    return `COT${sequence}/${yearSuffix}`;
  }

  private offerListInclude() {
    return {
      createdBy: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: { select: { items: true } },
    } as const;
  }

  private async findOwnedOffer(id: string, userId: string) {
    const offer = await this.prisma.offerCreated.findUnique({
      where: { id },
      select: { id: true, createdByUserId: true, status: true },
    });
    if (!offer) {
      throw new NotFoundException('Cotización no encontrada');
    }
    if (offer.createdByUserId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para modificar esta cotización',
      );
    }
    return offer;
  }

  /**
   * Validates type-specific invariants on offer items: digital billboards
   * need a valid spot count and reference an existing digital billboard;
   * misc items need a description.
   */
  private validateItems(items: CreateOfferItemDto[]): void {
    for (const item of items) {
      const type = item.itemType ?? OfferItemType.STATIC_BILLBOARD;
      if (type === OfferItemType.DIGITAL_BILLBOARD) {
        if (!item.digitalBillboardId) {
          throw new BadRequestException(
            'Cada valla digital debe tener una valla asociada',
          );
        }
        if (!item.spotCount || !ALLOWED_SPOT_COUNTS.has(item.spotCount)) {
          throw new BadRequestException(
            'La cantidad de spots debe ser 300, 450, 600 o 900',
          );
        }
        if (!item.startDate || !item.endDate) {
          throw new BadRequestException(
            'Cada valla digital debe tener fechas de inicio y fin',
          );
        }
      }
      if (type === OfferItemType.MISC) {
        const desc = item.description?.trim();
        if (!desc) {
          throw new BadRequestException(
            'Cada concepto adicional debe tener una descripción',
          );
        }
      }
    }
  }

  /**
   * Creates one usage row per day for each digital billboard item in the
   * offer, linked back to the originating offer item so they can be
   * removed if the offer is later rejected.
   */
  private async registerDigitalUsagesForOffer(
    tx: Prisma.TransactionClient,
    offerId: string,
  ): Promise<void> {
    const offer = await tx.offerCreated.findUnique({
      where: { id: offerId },
      select: {
        customerName: true,
        customerCompany: true,
        specialConditions: true,
        items: {
          select: {
            id: true,
            itemType: true,
            digitalBillboardId: true,
            spotCount: true,
            startDate: true,
            endDate: true,
            description: true,
          },
        },
      },
    });
    if (!offer) return;

    const plans = planDigitalUsages(offer, offer.items);
    if (plans.length === 0) return;

    const data: Prisma.DigitalBillboardUsageCreateManyInput[] = [];
    for (const plan of plans) {
      for (const day of plan.days) {
        data.push({
          digitalBillboardId: plan.digitalBillboardId,
          timestamp: day,
          duration: plan.spotCount,
          campaignName: plan.campaignName,
          campaignDescription: plan.campaignDescription,
          offerItemId: plan.itemId,
        });
      }
    }

    if (data.length > 0) {
      await tx.digitalBillboardUsage.createMany({ data });
    }
  }

  /**
   * Deletes all digital billboard usages registered through this offer.
   * Called when an accepted offer transitions away from ACCEPTED.
   */
  private async removeDigitalUsagesForOffer(
    tx: Prisma.TransactionClient,
    offerId: string,
  ): Promise<void> {
    await tx.digitalBillboardUsage.deleteMany({
      where: { offerItem: { offerId } },
    });
  }

  private async fetchBriloContractById(
    mconId: number,
  ): Promise<BriloContractOption | null> {
    const rows = await this.brilo.query<{
      mconId: number;
      mconCodigo: string;
      mconFecha: Date;
      ejecNombre: string | null;
    }>(BRILO_CONTRACT_BY_ID_SQL, { MconId: mconId });

    const row = rows[0];
    if (!row) return null;

    return {
      mconId: row.mconId,
      mconCodigo: row.mconCodigo,
      mconFecha: row.mconFecha.toISOString(),
      ejecNombre: row.ejecNombre,
    };
  }

  private async assertBriloContractExists(mconId: number): Promise<void> {
    const rows = await this.brilo.query<{ mconId: number }>(
      `
      SELECT maecon.mconId
      FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
      WHERE maecon.mconId = @MconId
        AND maecon.mconPosteado <> 0
        AND maecon.mconAnulado <> 1
      `,
      { MconId: mconId },
    );
    if (rows.length === 0) {
      throw new BadRequestException(
        'El contrato de Brilo seleccionado no existe',
      );
    }
  }

  private mapToDetail(
    row: {
      id: string;
      offerNumber: string;
      clientId: string | null;
      customerName: string;
      customerCompany: string | null;
      customerEmail: string | null;
      billingEmail: string | null;
      customerContact: string | null;
      validUntil: Date;
      specialConditions: string | null;
      advisorFullName: string | null;
      status: OfferStatus;
      briloMconId: number | null;
      subtotalImpression: number;
      ivaImpression: number;
      totalImpression: number;
      subtotalRental: number;
      ivaRental: number;
      totalRental: number;
      pdfS3Key: string | null;
      createdAt: Date;
      createdBy: {
        id: string;
        firstName: string;
        lastName: string | null;
        email: string;
      };
      _count: { items: number };
      items: Array<{
        id: string;
        itemType: OfferItemType;
        billboardId: number | null;
        billboardCode: string | null;
        address: string | null;
        cityName: string | null;
        departmentName: string | null;
        width: number | null;
        height: number | null;
        quantity: number;
        impressionPrice: number;
        rentalPrice: number;
        taxRate: number;
        description: string | null;
        digitalBillboardId: string | null;
        spotCount: number | null;
        startDate: Date | null;
        endDate: Date | null;
      }>;
    },
    linkedBriloContract: BriloContractOption | null,
  ): OfferDetail {
    return {
      ...this.mapToListItem(row),
      items: row.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        billboardId: item.billboardId,
        billboardCode: item.billboardCode,
        address: item.address,
        cityName: item.cityName,
        departmentName: item.departmentName,
        width: item.width,
        height: item.height,
        quantity: item.quantity,
        impressionPrice: item.impressionPrice,
        rentalPrice: item.rentalPrice,
        taxRate: item.taxRate,
        description: item.description,
        digitalBillboardId: item.digitalBillboardId,
        spotCount: item.spotCount,
        startDate: item.startDate?.toISOString() ?? null,
        endDate: item.endDate?.toISOString() ?? null,
      })),
      linkedBriloContract,
    };
  }

  private mapToListItem(row: {
    id: string;
    offerNumber: string;
    clientId: string | null;
    customerName: string;
    customerCompany: string | null;
    customerEmail: string | null;
    billingEmail: string | null;
    customerContact: string | null;
    validUntil: Date;
    specialConditions: string | null;
    advisorFullName: string | null;
    status: OfferStatus;
    briloMconId: number | null;
    subtotalImpression: number;
    ivaImpression: number;
    totalImpression: number;
    subtotalRental: number;
    ivaRental: number;
    totalRental: number;
    pdfS3Key: string | null;
    createdAt: Date;
    createdBy: {
      id: string;
      firstName: string;
      lastName: string | null;
      email: string;
    };
    _count: { items: number };
  }): OfferListItem {
    return {
      id: row.id,
      offerNumber: row.offerNumber,
      clientId: row.clientId,
      customerName: row.customerName,
      customerCompany: row.customerCompany,
      customerEmail: row.customerEmail,
      customerBillingEmail: row.billingEmail,
      customerContact: row.customerContact,
      validUntil: row.validUntil.toISOString(),
      specialConditions: row.specialConditions,
      advisorFullName: row.advisorFullName,
      status: row.status,
      briloMconId: row.briloMconId,
      subtotalImpression: row.subtotalImpression,
      ivaImpression: row.ivaImpression,
      totalImpression: row.totalImpression,
      subtotalRental: row.subtotalRental,
      ivaRental: row.ivaRental,
      totalRental: row.totalRental,
      itemCount: row._count.items,
      hasPdf: !!row.pdfS3Key,
      createdAt: row.createdAt.toISOString(),
      createdBy: row.createdBy,
    };
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[%_[\]\\]/g, '\\$&');
}

function enumerateMonthKeys(from: Date, to: Date): string[] {
  const keys: string[] = [];
  const start = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  const cursor = new Date(start);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    keys.push(`${year}-${month}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

const ALLOWED_SPOT_COUNTS = new Set([300, 450, 600, 900]);

interface OfferTotals {
  subtotalImpression: number;
  subtotalRental: number;
  ivaImpression: number;
  ivaRental: number;
  totalImpression: number;
  totalRental: number;
}

/**
 * Computes offer totals using each item's own `taxRate` so misc lines can
 * carry custom rates without breaking the standard 13% IVA flow.
 */
function computeOfferTotals(items: CreateOfferItemDto[]): OfferTotals {
  let subtotalImpression = 0;
  let subtotalRental = 0;
  let ivaImpression = 0;
  let ivaRental = 0;

  for (const item of items) {
    const tax = item.taxRate ?? DEFAULT_TAX_RATE;
    const lineImpression = item.impressionPrice * item.quantity;
    const lineRental = item.rentalPrice * item.quantity;
    subtotalImpression += lineImpression;
    subtotalRental += lineRental;
    ivaImpression += lineImpression * tax;
    ivaRental += lineRental * tax;
  }

  const subImp = round2(subtotalImpression);
  const subRen = round2(subtotalRental);
  const ivaImp = round2(ivaImpression);
  const ivaRen = round2(ivaRental);

  return {
    subtotalImpression: subImp,
    subtotalRental: subRen,
    ivaImpression: ivaImp,
    ivaRental: ivaRen,
    totalImpression: round2(subImp + ivaImp),
    totalRental: round2(subRen + ivaRen),
  };
}

/** Local-time start-of-day helper used to enumerate days within a range. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Inclusive list of days between two dates, normalized to local midnight. */
function enumerateDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = startOfDay(start);
  const final = startOfDay(end);
  while (cursor <= final) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

interface DigitalUsagePlan {
  itemId: string;
  digitalBillboardId: string;
  spotCount: number;
  days: Date[];
  campaignName: string | null;
  campaignDescription: string | null;
}

/**
 * Builds the per-day usage plan for digital billboard items in an offer.
 * Used both when accepting an offer (to register usages) and could be reused
 * for capacity validation in the future.
 */
function planDigitalUsages(
  offer: {
    customerName: string;
    customerCompany: string | null;
    specialConditions: string | null;
  },
  items: Array<{
    id: string;
    itemType: OfferItemType;
    digitalBillboardId: string | null;
    spotCount: number | null;
    startDate: Date | null;
    endDate: Date | null;
    description: string | null;
  }>,
): DigitalUsagePlan[] {
  const plans: DigitalUsagePlan[] = [];
  const campaignName =
    (offer.customerCompany?.trim() || offer.customerName?.trim()) ?? null;
  const campaignDescription = offer.specialConditions?.trim() || null;

  for (const item of items) {
    if (item.itemType !== OfferItemType.DIGITAL_BILLBOARD) continue;
    if (!item.digitalBillboardId || !item.spotCount) continue;
    if (!item.startDate || !item.endDate) continue;
    const days = enumerateDays(item.startDate, item.endDate);
    if (days.length === 0) continue;
    plans.push({
      itemId: item.id,
      digitalBillboardId: item.digitalBillboardId,
      spotCount: item.spotCount,
      days,
      campaignName: item.description?.trim() || campaignName,
      campaignDescription,
    });
  }
  return plans;
}
