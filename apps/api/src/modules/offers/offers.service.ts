import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { S3StorageService } from '../s3-images/s3-storage.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';

const IVA_RATE = 0.13;
const OFFER_PDF_FOLDER = 'offers';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export interface OfferListItem {
  id: string;
  offerNumber: string;
  clientId: string | null;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string | null;
  customerContact: string | null;
  validUntil: string;
  specialConditions: string | null;
  advisorFullName: string | null;
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

export interface ListOffersFilters {
  search?: string;
  limit?: number;
  cursor?: string;
}

export interface PaginatedOffers {
  data: OfferListItem[];
  nextCursor: string | null;
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

    const subtotalImpression = round2(
      dto.items.reduce(
        (sum, item) => sum + item.impressionPrice * item.quantity,
        0,
      ),
    );
    const subtotalRental = round2(
      dto.items.reduce(
        (sum, item) => sum + item.rentalPrice * item.quantity,
        0,
      ),
    );
    const ivaImpression = round2(subtotalImpression * IVA_RATE);
    const ivaRental = round2(subtotalRental * IVA_RATE);
    const totalImpression = round2(subtotalImpression + ivaImpression);
    const totalRental = round2(subtotalRental + ivaRental);

    const offerNumber = await this.generateOfferNumber();
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

    try {
      const created = await this.prisma.offerCreated.create({
        data: {
          offerNumber,
          clientId,
          customerName: dto.customerName.trim(),
          customerCompany: dto.customerCompany?.trim() || null,
          customerEmail: dto.customerEmail?.trim().toLowerCase() || null,
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
              startDate: item.startDate ? new Date(item.startDate) : null,
              endDate: item.endDate ? new Date(item.endDate) : null,
            })),
          },
        },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: { select: { items: true } },
        },
      });

      return this.mapToListItem(created);
    } catch (e) {
      if (uploadedKey) {
        await this.storage.deleteByKey(uploadedKey);
      }
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'Se generó un número de cotización duplicado, intenta de nuevo.',
        );
      }
      throw e;
    }
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

  async getDownloadUrl(id: string): Promise<{ url: string }> {
    const row = await this.prisma.offerCreated.findUnique({
      where: { id },
      select: { pdfS3Key: true },
    });
    if (!row) throw new NotFoundException('Cotización no encontrada');
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

    const count = await this.prisma.offerCreated.count({
      where: { createdAt: { gte: yearStart, lt: yearEnd } },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `COT${sequence}/${yearSuffix}`;
  }

  private mapToListItem(row: {
    id: string;
    offerNumber: string;
    clientId: string | null;
    customerName: string;
    customerCompany: string | null;
    customerEmail: string | null;
    customerContact: string | null;
    validUntil: Date;
    specialConditions: string | null;
    advisorFullName: string | null;
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
      customerContact: row.customerContact,
      validUntil: row.validUntil.toISOString(),
      specialConditions: row.specialConditions,
      advisorFullName: row.advisorFullName,
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
