import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BriloSyncStatus, OfferEventType } from '@prisma/client';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { BriloWebapiService } from '../brilo-webapi/brilo-webapi.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BRILO_ACTIVE_EXECUTIVES_SQL,
  BRILO_CLIENT_BY_ID_SQL,
  BRILO_CLIENTS_BY_EMAIL_SQL,
  BRILO_CLIENTS_SEARCH_SQL,
  BRILO_COTIZACION_BY_ID_SQL,
  briloStaticItems,
  buildBriloContrato,
  buildBriloCotizacion,
  matchExecutivesByName,
  toBriloClientOption,
  type BriloClientOption,
  type BriloClientRow,
  type BriloDocumentHeader,
  type BriloExecutiveOption,
} from './offer-brilo-documents.js';

const BRILO_CLIENTS_PAGE_SIZE = 30;
const MAX_SYNC_ERROR_LENGTH = 1000;

export interface BriloAcceptContext {
  /** False when the offer has no static billboards, so nothing goes to Brilo. */
  requiresBriloDocuments: boolean;
  staticItemCount: number;
  customerEmail: string | null;
  clientMatches: BriloClientOption[];
  advisorFullName: string | null;
  executives: BriloExecutiveOption[];
  executiveMatchIds: number[];
}

export interface PaginatedBriloClients {
  data: BriloClientOption[];
  total: number;
  page: number;
  pageSize: number;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[%_[\]\\]/g, '\\$&');
}

@Injectable()
export class OfferBriloSyncService {
  private readonly logger = new Logger(OfferBriloSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly briloDb: BriloDatabaseService,
    private readonly briloApi: BriloWebapiService,
  ) {}

  async getAcceptContext(offerId: string): Promise<BriloAcceptContext> {
    const offer = await this.prisma.offerCreated.findUniqueOrThrow({
      where: { id: offerId },
      select: {
        customerEmail: true,
        billingEmail: true,
        advisorFullName: true,
        items: {
          select: {
            itemType: true,
            billboardId: true,
            quantity: true,
            impressionPrice: true,
            rentalPrice: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    const staticItemCount = briloStaticItems(offer.items).length;
    if (staticItemCount === 0) {
      return {
        requiresBriloDocuments: false,
        staticItemCount,
        customerEmail: offer.customerEmail,
        clientMatches: [],
        advisorFullName: offer.advisorFullName,
        executives: [],
        executiveMatchIds: [],
      };
    }

    const [clientMatches, executives] = await Promise.all([
      this.findClientsByEmail(offer.customerEmail, offer.billingEmail),
      this.listExecutives(),
    ]);

    return {
      requiresBriloDocuments: true,
      staticItemCount,
      customerEmail: offer.customerEmail,
      clientMatches,
      advisorFullName: offer.advisorFullName,
      executives,
      executiveMatchIds: matchExecutivesByName(
        offer.advisorFullName,
        executives,
      ).map((executive) => executive.ejecId),
    };
  }

  async searchClients(filters: {
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedBriloClients> {
    const page = Math.max(Math.floor(filters.page ?? 1), 1);
    const pageSize = Math.min(
      Math.max(Math.floor(filters.pageSize ?? BRILO_CLIENTS_PAGE_SIZE), 1),
      100,
    );
    const search = filters.search?.trim() ?? '';

    const rows = await this.briloDb.query<
      BriloClientRow & { totalCount: number }
    >(BRILO_CLIENTS_SEARCH_SQL, {
      Search: search,
      SearchLike: `%${escapeLikePattern(search)}%`,
      Offset: (page - 1) * pageSize,
      PageSize: pageSize,
    });

    return {
      data: rows.map(toBriloClientOption),
      total: rows[0]?.totalCount ?? 0,
      page,
      pageSize,
    };
  }

  async listExecutives(): Promise<BriloExecutiveOption[]> {
    const rows = await this.briloDb.query<BriloExecutiveOption>(
      BRILO_ACTIVE_EXECUTIVES_SQL,
    );
    return rows.map((row) => ({
      ejecId: row.ejecId,
      ejecCodigo: row.ejecCodigo?.trim() || null,
      ejecNombre: row.ejecNombre.trim(),
    }));
  }

  async assertCanCreateDocuments(cliId: number, ejecId: number): Promise<void> {
    const [clients, executives] = await Promise.all([
      this.briloDb.query<BriloClientRow>(BRILO_CLIENT_BY_ID_SQL, {
        CliId: cliId,
      }),
      this.listExecutives(),
    ]);
    if (clients.length === 0) {
      throw new BadRequestException(
        'El cliente de Brilo seleccionado no existe',
      );
    }
    if (!executives.some((executive) => executive.ejecId === ejecId)) {
      throw new BadRequestException(
        'El ejecutivo de Brilo seleccionado no existe o está inactivo',
      );
    }
  }

  /**
   * Creates the Brilo cotización and the posted contrato for an accepted offer
   * and links the contract back. Never throws: a Brilo failure is stored on the
   * offer so the acceptance stands and the user can retry. Each document id is
   * saved as soon as Brilo returns it, so a retry never duplicates a document
   * that was already created.
   */
  async sync(offerId: string, actorUserId: string | null): Promise<void> {
    const offer = await this.prisma.offerCreated.findUniqueOrThrow({
      where: { id: offerId },
      select: {
        offerNumber: true,
        customerName: true,
        customerContact: true,
        briloCliId: true,
        briloEjecId: true,
        briloMcotId: true,
        briloMconId: true,
        items: {
          orderBy: { createdAt: 'asc' },
          select: {
            itemType: true,
            billboardId: true,
            quantity: true,
            impressionPrice: true,
            rentalPrice: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
    if (offer.briloMconId) return;

    const items = briloStaticItems(offer.items);
    let mcotId = offer.briloMcotId;

    try {
      if (!offer.briloCliId || !offer.briloEjecId) {
        throw new Error('Falta el cliente o el ejecutivo de Brilo');
      }
      if (items.length === 0) {
        throw new Error('La cotización no tiene vallas estáticas para Brilo');
      }

      const header: BriloDocumentHeader = {
        offerNumber: offer.offerNumber,
        customerName: offer.customerName,
        customerContact: offer.customerContact,
        cliId: offer.briloCliId,
        ejecId: offer.briloEjecId,
      };

      if (!mcotId) {
        const cotizacion = await this.briloApi.createCotizacion(
          buildBriloCotizacion(header, items),
        );
        if (!cotizacion.mcotId) {
          throw new Error(
            'Brilo no devolvió el identificador de la cotización',
          );
        }
        mcotId = cotizacion.mcotId;
        await this.prisma.offerCreated.update({
          where: { id: offerId },
          data: { briloMcotId: mcotId },
        });
      }

      const contrato = await this.briloApi.createContrato(
        buildBriloContrato(header, items, mcotId),
      );
      if (!contrato.mconId) {
        throw new Error('Brilo no devolvió el identificador del contrato');
      }

      const cotizacionNumero = await this.fetchCotizacionNumero(mcotId);
      const contratoLabel = contrato.mconCodigo ?? `#${contrato.mconId}`;
      const cotizacionLabel = cotizacionNumero ?? `#${mcotId}`;

      await this.prisma.$transaction([
        this.prisma.offerCreated.update({
          where: { id: offerId },
          data: {
            briloMconId: contrato.mconId,
            briloSyncStatus: BriloSyncStatus.SYNCED,
            briloSyncError: null,
          },
        }),
        this.prisma.offerEvent.create({
          data: {
            offerId,
            type: OfferEventType.BRILO_SYNCED,
            message: `Cotización ${cotizacionLabel} y contrato ${contratoLabel} creados en Brilo`,
            changes: { briloMconId: { from: null, to: contrato.mconId } },
            actorUserId,
          },
        }),
      ]);
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(
        0,
        MAX_SYNC_ERROR_LENGTH,
      );
      this.logger.warn(`Brilo sync failed for offer ${offerId}: ${message}`);

      await this.prisma.$transaction([
        this.prisma.offerCreated.update({
          where: { id: offerId },
          data: {
            briloSyncStatus: BriloSyncStatus.FAILED,
            briloSyncError: message,
          },
        }),
        this.prisma.offerEvent.create({
          data: {
            offerId,
            type: OfferEventType.BRILO_SYNC_FAILED,
            message: `No se pudo crear ${mcotId ? 'el contrato' : 'la cotización'} en Brilo: ${message}`,
            actorUserId,
          },
        }),
      ]);
    }
  }

  private async findClientsByEmail(
    email: string | null,
    billingEmail: string | null,
  ): Promise<BriloClientOption[]> {
    const primary = email?.trim().toLowerCase();
    const billing = billingEmail?.trim().toLowerCase();
    if (!primary && !billing) return [];

    const rows = await this.briloDb.query<BriloClientRow>(
      BRILO_CLIENTS_BY_EMAIL_SQL,
      { Email1: primary || billing, Email2: billing || primary },
    );
    return rows.map(toBriloClientOption);
  }

  private async fetchCotizacionNumero(mcotId: number): Promise<string | null> {
    try {
      const rows = await this.briloDb.query<{ mcotNumero: string | null }>(
        BRILO_COTIZACION_BY_ID_SQL,
        { McotId: mcotId },
      );
      return rows[0]?.mcotNumero?.trim() || null;
    } catch {
      return null;
    }
  }
}
