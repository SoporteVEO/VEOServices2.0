import { BadRequestException, Injectable } from '@nestjs/common';
import { unwrapSingle } from '../brilo-webapi/brilo-response.js';
import { BriloWebapiService } from '../brilo-webapi/brilo-webapi.service.js';
import type {
  CreateBankChargeDto,
  CreateBankDepositDto,
  ListBankMovementsQueryDto,
} from './dto/banks.dto.js';
import {
  dateRange,
  fetchBriloList,
  fetchBriloPage,
  parsePaging,
} from './finance-paging.js';
import type {
  BriloAbonoBanco,
  BriloCargoBanco,
  BriloCuentaBanco,
  BriloTipoAbonoBanco,
  BriloTipoCargoBanco,
} from './finance.types.js';

const CATALOG_PAGE = { per_page: 500 };

/** Brilo requires a number or a full date range to list bank movements. */
function movementFilters(query: ListBankMovementsQueryDto) {
  const range = dateRange(query.from, query.to);
  const number = query.number?.trim();
  if (!number && !range.fecha_desde) {
    throw new BadRequestException(
      'Indica un rango de fechas o un número de documento.',
    );
  }
  return { number, range };
}

function optional(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

@Injectable()
export class BanksService {
  constructor(private readonly brilo: BriloWebapiService) {}

  async getCatalogs() {
    const [accounts, depositTypes, chargeTypes] = await Promise.all([
      fetchBriloList<BriloCuentaBanco>(
        this.brilo,
        '/v2/Comun/GetCuentasBco',
        CATALOG_PAGE,
      ),
      fetchBriloList<BriloTipoAbonoBanco>(
        this.brilo,
        '/Bancos/GetTiposAbonoBco',
        CATALOG_PAGE,
      ),
      fetchBriloList<BriloTipoCargoBanco>(
        this.brilo,
        '/Bancos/GetTiposCargoBco',
        CATALOG_PAGE,
      ),
    ]);
    return { accounts, depositTypes, chargeTypes };
  }

  listDeposits(query: ListBankMovementsQueryDto) {
    const { number, range } = movementFilters(query);
    return fetchBriloPage<BriloAbonoBanco>(
      this.brilo,
      '/Bancos/GetAbonosBco',
      parsePaging(query, 50),
      { abnNumero: number, ...range },
    );
  }

  listCharges(query: ListBankMovementsQueryDto) {
    const { number, range } = movementFilters(query);
    return fetchBriloPage<BriloCargoBanco>(
      this.brilo,
      '/Bancos/GetCargosBco',
      parsePaging(query, 50),
      { crgNumero: number, ...range },
    );
  }

  async createDeposit(dto: CreateBankDepositDto) {
    const { data } = await this.brilo.send('POST', '/Bancos/SetAbonoBco', {
      body: {
        bcuNumero: dto.bankAccountNumber.trim(),
        tabCodigo: dto.typeCode.trim(),
        abnMonto: dto.amount,
        abnNumero: optional(dto.number),
        abnFecha: optional(dto.date),
        abnFechaAplicaBanco: optional(dto.bankDate),
        abnMotivo: optional(dto.reason),
        cecoCodigo: optional(dto.costCenterCode),
        monCodigo: optional(dto.currencyCode),
      },
    });
    return unwrapSingle<BriloAbonoBanco>(data);
  }

  async createCharge(dto: CreateBankChargeDto) {
    const { data } = await this.brilo.send('POST', '/Bancos/SetCargoBco', {
      body: {
        bcuNumero: dto.bankAccountNumber.trim(),
        tcbCodigo: dto.typeCode.trim(),
        crgMonto: dto.amount,
        crgNumero: optional(dto.number),
        crgFecha: optional(dto.date),
        crgFechaAplicaBanco: optional(dto.bankDate),
        crgMotivo: optional(dto.reason),
        crgAcreedor: optional(dto.creditor),
        crgChequeEntregado: dto.chequeDelivered ?? false,
        cecoCodigo: optional(dto.costCenterCode),
        monCodigo: optional(dto.currencyCode),
        prvCodigo: optional(dto.supplierCode),
      },
    });
    return unwrapSingle<BriloCargoBanco>(data);
  }

  async deleteDeposit(abnId: number) {
    await this.brilo.send('DELETE', '/Bancos/DelAbonoBco', {
      query: { abnId },
    });
    return { deleted: true };
  }

  async deleteCharge(crgId: number) {
    await this.brilo.send('DELETE', '/Bancos/DelCargoBco', {
      query: { crgId },
    });
    return { deleted: true };
  }
}
