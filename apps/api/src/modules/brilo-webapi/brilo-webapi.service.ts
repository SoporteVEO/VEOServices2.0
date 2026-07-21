import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type {
  BriloAbonoFacturaInput,
  BriloAbonoFacturaResponse,
} from './brilo-webapi.types.js';

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

  private async request<T>(
    path: string,
    init: RequestInit & { query?: Record<string, string | number | undefined> },
  ): Promise<T> {
    const { baseUrl } = this.getConfig();
    const url = new URL(
      `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
    );
    if (init.query) {
      for (const [key, value] of Object.entries(init.query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        ...init,
        headers: { ...this.buildHeaders(), ...(init.headers ?? {}) },
      });
    } catch (err) {
      this.logger.error(`Brilo WebAPI network error (${path})`, err as Error);
      throw new BadGatewayException(
        'No se pudo conectar con Brilo WebAPI. Verifica la conexión y vuelve a intentarlo.',
      );
    }

    const rawText = await response.text();
    const parsed = this.safeJsonParse(rawText);

    if (!response.ok) {
      const message =
        this.extractErrorMessage(parsed) ||
        (typeof rawText === 'string' && rawText.length > 0
          ? rawText.slice(0, 300)
          : `Error HTTP ${response.status} llamando a ${path}`);
      this.logger.warn(
        `Brilo WebAPI ${response.status} on ${path}: ${message}`,
      );
      throw new BadGatewayException(message);
    }

    return parsed as T;
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
