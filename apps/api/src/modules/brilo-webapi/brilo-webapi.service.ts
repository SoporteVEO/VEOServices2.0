import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type {
  BriloAbonoFacturaInput,
  BriloAbonoFacturaResponse,
  BriloContratoInput,
  BriloContratoResponse,
  BriloCotizacionInput,
  BriloCotizacionResponse,
} from './brilo-webapi.types.js';
import { unwrapSingle } from './brilo-response.js';

export type BriloQueryValue = string | number | boolean | string[] | undefined;
export type BriloQuery = Record<string, BriloQueryValue>;
export type BriloMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface BriloResult<T> {
  data: T;
  /** From the `X-Total-Count` header; only some endpoints send it. */
  total: number | null;
}

export interface BriloFile {
  buffer: Buffer;
  contentType: string;
  fileName: string | null;
}

interface BriloErrorBody {
  message?: string;
  Message?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[] | string>;
}

/**
 * Thin HTTP client for the Brilo WebAPI. Centralizes auth-token + base URL
 * handling and converts Brilo's varied error shapes into Nest exceptions with
 * Spanish-friendly messages that the frontend can surface directly.
 */
@Injectable()
export class BriloWebapiService {
  private readonly logger = new Logger(BriloWebapiService.name);

  isConfigured(): boolean {
    return (
      !!process.env.BRILO_WEBAPI_URL?.trim() &&
      !!process.env.BRILO_WEBAPI_TOKEN?.trim()
    );
  }

  private getConfig(): { baseUrl: string; token: string } {
    const baseUrl = process.env.BRILO_WEBAPI_URL?.trim();
    const token = process.env.BRILO_WEBAPI_TOKEN?.trim();
    if (!baseUrl || !token) {
      throw new InternalServerErrorException(
        'La integración con Brilo WebAPI no está configurada (BRILO_WEBAPI_URL / BRILO_WEBAPI_TOKEN).',
      );
    }
    return { baseUrl: baseUrl.replace(/\/+$/, ''), token };
  }

  private buildHeaders(): HeadersInit {
    const { token } = this.getConfig();
    return {
      authToken: token,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private buildUrl(path: string, query?: BriloQuery): URL {
    const { baseUrl } = this.getConfig();
    const url = new URL(
      `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
    );
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null || value === '') continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, item);
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    return url;
  }

  private async fetchRaw(
    path: string,
    init: RequestInit & { query?: BriloQuery },
  ): Promise<Response> {
    const { query, ...rest } = init;
    const url = this.buildUrl(path, query);

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...rest,
        headers: { ...this.buildHeaders(), ...(rest.headers ?? {}) },
      });
    } catch (err) {
      this.logger.error(`Brilo WebAPI network error (${path})`, err as Error);
      throw new BadGatewayException(
        'No se pudo conectar con Brilo WebAPI. Verifica la conexión y vuelve a intentarlo.',
      );
    }

    if (!response.ok) {
      const rawText = await response.text();
      const parsed = this.safeJsonParse(rawText);
      const message =
        this.extractErrorMessage(parsed) ||
        (rawText.length > 0
          ? rawText.slice(0, 300)
          : `Error HTTP ${response.status} llamando a ${path}`);
      this.logger.warn(
        `Brilo WebAPI ${response.status} on ${path}: ${message}`,
      );
      throw new BadGatewayException(message);
    }

    return response;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { query?: BriloQuery },
  ): Promise<T> {
    const response = await this.fetchRaw(path, init);
    return this.safeJsonParse(await response.text()) as T;
  }

  /**
   * Generic passthrough for the finance modules. `path` is relative to
   * BRILO_WEBAPI_URL (which already ends in `/api`), e.g. `/v2/Conta/Partidas`.
   */
  async send<T = unknown>(
    method: BriloMethod,
    path: string,
    options: { query?: BriloQuery; body?: unknown } = {},
  ): Promise<BriloResult<T>> {
    const response = await this.fetchRaw(path, {
      method,
      query: options.query,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
    const totalHeader = response.headers.get('x-total-count');
    const total = totalHeader != null ? Number(totalHeader) : null;
    return {
      data: this.safeJsonParse(await response.text()) as T,
      total: Number.isFinite(total) ? total : null,
    };
  }

  async fetchFile(path: string, query?: BriloQuery): Promise<BriloFile> {
    const response = await this.fetchRaw(path, {
      method: 'GET',
      query,
      headers: { Accept: 'application/pdf, application/octet-stream, */*' },
    });
    const disposition = response.headers.get('content-disposition') ?? '';
    const fileName = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get('content-type') ?? 'application/pdf',
      fileName: fileName ? decodeURIComponent(fileName[1]) : null,
    };
  }

  private safeJsonParse(text: string): unknown {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private extractErrorMessage(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null;
    const err = body as BriloErrorBody;
    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message.trim();
    }
    if (typeof err.Message === 'string' && err.Message.trim()) {
      return err.Message.trim();
    }
    if (typeof err.detail === 'string' && err.detail.trim()) {
      return err.detail.trim();
    }
    if (typeof err.title === 'string' && err.title.trim()) {
      return err.title.trim();
    }
    if (err.errors && typeof err.errors === 'object') {
      const flat = Object.values(err.errors)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((v) => typeof v === 'string' && v.trim().length > 0);
      if (flat.length > 0) return flat.join('. ');
    }
    return null;
  }

  async createAbonoFactura(
    input: BriloAbonoFacturaInput,
  ): Promise<BriloAbonoFacturaResponse> {
    const body = this.buildAbonoFacturaBody(input);
    const raw = await this.request<BriloAbonoFacturaResponse>(
      '/CXC/AbonoFactura',
      { method: 'POST', body: JSON.stringify(body) },
    );
    return raw;
  }

  async createCotizacion(
    input: BriloCotizacionInput,
  ): Promise<BriloCotizacionResponse> {
    const raw = await this.request<unknown>('/Vallas/Cotizaciones', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return unwrapSingle<BriloCotizacionResponse>(raw);
  }

  async createContrato(
    input: BriloContratoInput,
  ): Promise<BriloContratoResponse> {
    const raw = await this.request<unknown>('/Vallas/Contratos', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return unwrapSingle<BriloContratoResponse>(raw);
  }

  private buildAbonoFacturaBody(
    input: BriloAbonoFacturaInput,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      FechaAbono: input.fechaAbono,
      ValorAbonoPropio: input.valorAbonoPropio,
      TipoAbono: input.tipoAbono,
      TipoFactura: input.tipoFactura,
      NumFactura: input.numFactura,
    };
    if (input.numDocAbono) body.NumDocAbono = input.numDocAbono;
    if (input.observaciones) body.Observaciones = input.observaciones;
    if (input.numAbono) body.NumAbono = input.numAbono;
    if (input.bcoCodigo) body.bcoCodigo = input.bcoCodigo;
    if (typeof input.bcoId === 'number') body.bcoId = input.bcoId;
    return body;
  }
}
