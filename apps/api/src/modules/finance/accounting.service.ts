import { BadRequestException, Injectable } from '@nestjs/common';
import { unwrapList, unwrapSingle } from '../brilo-webapi/brilo-response.js';
import { BriloWebapiService } from '../brilo-webapi/brilo-webapi.service.js';
import type {
  CreateEntryDto,
  ListAccountsQueryDto,
  ListCostCentersQueryDto,
  ListEntriesQueryDto,
  UpsertEntryLineDto,
} from './dto/accounting.dto.js';
import {
  dateRange,
  fetchBriloList,
  fetchBriloPage,
  parsePaging,
} from './finance-paging.js';
import type {
  BriloCentroCosto,
  BriloCuentaConta,
  BriloDetallePartida,
  BriloDetallePartidaInput,
  BriloPartida,
  BriloTipoPartida,
} from './finance.types.js';

@Injectable()
export class AccountingService {
  constructor(private readonly brilo: BriloWebapiService) {}

  listAccounts(query: ListAccountsQueryDto) {
    return fetchBriloPage<BriloCuentaConta>(
      this.brilo,
      '/v2/Conta/CuentasConta',
      parsePaging(query, 50),
      {
        cueCodigo: query.code?.trim() || undefined,
        cueNombre: query.name?.trim() || undefined,
        cueCodigoPadre: query.parentCode?.trim() || undefined,
      },
    );
  }

  listCostCenters(query: ListCostCentersQueryDto) {
    return fetchBriloPage<BriloCentroCosto>(
      this.brilo,
      '/v2/Conta/CentrosCosto',
      parsePaging(query, 50),
      {
        cecoCodigo: query.code?.trim() || undefined,
        cecoNombre: query.name?.trim() || undefined,
        cecoCodigoPadre: query.parentCode?.trim() || undefined,
      },
    );
  }

  listEntryTypes() {
    return fetchBriloList<BriloTipoPartida>(
      this.brilo,
      '/v2/Conta/TiposPartida',
      { soloActivos: true, per_page: 200 },
    );
  }

  listEntries(query: ListEntriesQueryDto) {
    const range = dateRange(query.from, query.to);
    return fetchBriloPage<BriloPartida>(
      this.brilo,
      '/v2/Conta/Partidas',
      parsePaging(query, 25),
      {
        fechaDesde: range.fecha_desde,
        fechaHasta: range.fecha_hasta,
        mpaNumero: query.number?.trim() || undefined,
        tpaCodigo: query.typeCode,
      },
    );
  }

  async getEntry(mpaId: number) {
    const [entry, lines] = await Promise.all([
      this.brilo.send('GET', `/v2/Conta/Partida/${mpaId}`),
      this.brilo.send('GET', `/v2/Conta/Partida/${mpaId}/Detalles`),
    ]);
    return {
      entry: unwrapSingle<BriloPartida>(entry.data),
      lines: unwrapList<BriloDetallePartida>(lines.data),
    };
  }

  async createEntry(dto: CreateEntryDto) {
    const { data } = await this.brilo.send('POST', '/v2/Conta/Partida', {
      body: {
        mpaFecha: dto.date,
        mpaDescripcion: dto.description.trim(),
        tpaCodigo: dto.typeCode,
        ...(dto.number?.trim() ? { mpaNumero: dto.number.trim() } : {}),
      },
    });
    return unwrapSingle<BriloPartida>(data);
  }

  async addLine(mpaId: number, dto: UpsertEntryLineDto) {
    const { data } = await this.brilo.send(
      'POST',
      `/v2/Conta/Partida/${mpaId}/Detalle`,
      { body: toLineBody(dto) },
    );
    return unwrapSingle<BriloDetallePartida>(data);
  }

  async updateLine(mpaId: number, dpaId: number, dto: UpsertEntryLineDto) {
    const { data } = await this.brilo.send(
      'PUT',
      `/v2/Conta/Partida/${mpaId}/Detalle/${dpaId}`,
      { body: toLineBody(dto) },
    );
    return unwrapSingle<BriloDetallePartida>(data);
  }

  async deleteLine(mpaId: number, dpaId: number) {
    await this.brilo.send(
      'DELETE',
      `/v2/Conta/Partida/${mpaId}/Detalle/${dpaId}`,
    );
    return { deleted: true };
  }
}

function toLineBody(dto: UpsertEntryLineDto): BriloDetallePartidaInput {
  const hasDebit = dto.debit > 0;
  const hasCredit = dto.credit > 0;
  if (hasDebit === hasCredit) {
    throw new BadRequestException(
      'Cada asiento debe llevar un monto en el debe o en el haber, no en ambos.',
    );
  }
  const optional = (value: string | undefined) => value?.trim() || undefined;
  return {
    cueCodigo: dto.accountCode.trim(),
    dpaDebe: dto.debit,
    dpaHaber: dto.credit,
    dpaDescripcion: optional(dto.description),
    dpaFechaDoc: optional(dto.documentDate),
    dpaTipoDoc: optional(dto.documentType),
    dpaNumDoc: optional(dto.documentNumber),
    dpaNomSujeto: optional(dto.subject),
    cecoCodigo: optional(dto.costCenterCode),
    cecoCodigoSub: optional(dto.costCenterSubCode),
    dpaReferencia: optional(dto.reference),
  };
}
