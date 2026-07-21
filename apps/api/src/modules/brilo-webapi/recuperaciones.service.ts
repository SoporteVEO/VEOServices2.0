import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BriloDatabaseService } from '../brilo-database/brilo-database.service.js';
import { BriloWebapiService } from './brilo-webapi.service.js';
import type {
  BriloAbonoFacturaInput,
  BriloAbonoFacturaResponse,
  BriloBanco,
  BriloTipoAbono,
} from './brilo-webapi.types.js';

export interface RecuperacionRowInput {
  /** External row identifier (e.g. Excel row number) so the frontend can match results. */
  rowKey: string;
  /** Fecha del abono en formato ISO (YYYY-MM-DD or full ISO). */
  fechaAbono: string;
  /** Monto a abonar — debe ser > 0. */
  monto: number;
  /** Código del tipo de abono en Brilo (tabCodigo, ej. "CHE", "TRA", "EFE"). */
  tipoAbono: string;
  /** Tipo de documento de la factura (ej. "CCF", "FCF"). */
  tipoFactura: string;
  /** Número de factura — admite GUID o mfaNumDoc. */
  numFactura: string;
  /** Código del banco (opcional). */
  bancoCodigo?: string | null;
  numDocAbono?: string | null;
  observaciones?: string | null;
}

export interface RecuperacionRowResult {
  rowKey: string;
  ok: boolean;
  error?: string;
  response?: BriloAbonoFacturaResponse;
}

export interface ProcessRecuperacionesResult {
  total: number;
  successCount: number;
  errorCount: number;
  results: RecuperacionRowResult[];
}

interface BancoRow {
  bcoId: number;
  bcoCodigo: string;
  bcoNombre: string;
  bcoNombreAbr: string;
  bcoActivo: boolean;
}

interface TipoAbonoRow {
  tabId: number;
  tabCodigo: string;
  tabNombre: string;
}

@Injectable()
export class RecuperacionesService {
  private readonly logger = new Logger(RecuperacionesService.name);

  constructor(
    private readonly briloWebapi: BriloWebapiService,
    private readonly briloDb: BriloDatabaseService,
  ) {}

  async getCatalogos(): Promise<{
    bancos: BriloBanco[];
    tiposAbono: BriloTipoAbono[];
  }> {
    const [bancos, tiposAbono] = await Promise.all([
      this.fetchBancos(),
      this.fetchTiposAbono(),
    ]);
    return { bancos, tiposAbono };
  }

  /**
   * Reads the active banks directly from the legacy SQL Server. We do this
   * instead of going through the WebAPI because the WebAPI does not expose
   * a generic "list banks" endpoint reliably across deployments, and we
   * already have read-only DB access.
   */
  private async fetchBancos(): Promise<BriloBanco[]> {
    const rows = await this.briloDb.query<BancoRow>(
      `SELECT bcoId, bcoCodigo, bcoNombre, bcoNombreAbr, bcoActivo
       FROM olComun.dbo.Bancos WITH (NOLOCK)
       WHERE bcoActivo = 1
       ORDER BY bcoNombre`,
    );
    return rows.map((r) => ({
      bcoId: r.bcoId,
      bcoCodigo: r.bcoCodigo,
      bcoNombre: r.bcoNombre,
      bcoNombreAbr: r.bcoNombreAbr,
    }));
  }

  private async fetchTiposAbono(): Promise<BriloTipoAbono[]> {
    const rows = await this.briloDb.query<TipoAbonoRow>(
      `SELECT tabId, tabCodigo, tabNombre
       FROM olVentas.dbo.TiposAbono WITH (NOLOCK)
       WHERE tabEliminado = 0 AND tabDisponible = 1
       ORDER BY tabOrden, tabNombre`,
    );
    return rows.map((r) => ({
      tabId: r.tabId,
      tabCodigo: r.tabCodigo,
      tabNombre: r.tabNombre,
    }));
  }

  async processRows(
    rows: RecuperacionRowInput[],
  ): Promise<ProcessRecuperacionesResult> {
    if (!rows.length) {
      throw new BadRequestException('No se enviaron filas para procesar.');
    }

    const results: RecuperacionRowResult[] = [];
    for (const row of rows) {
      const result = await this.processSingleRow(row);
      results.push(result);
    }

    return {
      total: results.length,
      successCount: results.filter((r) => r.ok).length,
      errorCount: results.filter((r) => !r.ok).length,
      results,
    };
  }

  private async processSingleRow(
    row: RecuperacionRowInput,
  ): Promise<RecuperacionRowResult> {
    try {
      this.validateRow(row);
      const payload: BriloAbonoFacturaInput = {
        fechaAbono: this.normalizeDateForBrilo(row.fechaAbono),
        valorAbonoPropio: row.monto,
        tipoAbono: row.tipoAbono.trim(),
        tipoFactura: row.tipoFactura.trim(),
        numFactura: row.numFactura.trim(),
        ...(row.bancoCodigo ? { bcoCodigo: row.bancoCodigo.trim() } : {}),
        ...(row.numDocAbono ? { numDocAbono: row.numDocAbono.trim() } : {}),
        ...(row.observaciones
          ? { observaciones: row.observaciones.trim() }
          : {}),
      };

      const response = await this.briloWebapi.createAbonoFactura(payload);
      return { rowKey: row.rowKey, ok: true, response };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error desconocido al procesar.';
      this.logger.warn(
        `Recuperación falló para fila ${row.rowKey}: ${message}`,
      );
      return { rowKey: row.rowKey, ok: false, error: message };
    }
  }

  private validateRow(row: RecuperacionRowInput): void {
    if (!row.rowKey) throw new Error('rowKey requerido.');
    if (!Number.isFinite(row.monto) || row.monto <= 0) {
      throw new Error('El monto debe ser un número positivo.');
    }
    if (!row.tipoAbono?.trim()) {
      throw new Error('Tipo de abono requerido (ej: CHE, TRA, EFE).');
    }
    if (!row.tipoFactura?.trim()) {
      throw new Error('Tipo de factura requerido (ej: CCF, FCF).');
    }
    if (!row.numFactura?.trim()) {
      throw new Error('Número de factura requerido.');
    }
    if (!row.fechaAbono?.trim()) {
      throw new Error('Fecha de abono requerida.');
    }
  }

  private normalizeDateForBrilo(value: string): string {
    const trimmed = value.trim();
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Fecha de abono inválida: ${value}`);
    }
    return parsed.toISOString();
  }
}
