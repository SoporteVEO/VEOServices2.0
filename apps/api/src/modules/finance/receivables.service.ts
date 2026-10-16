import { Injectable } from '@nestjs/common';
import { unwrapSingle } from '../brilo-webapi/brilo-response.js';
import { BriloWebapiService } from '../brilo-webapi/brilo-webapi.service.js';
import type {
  CreateAdvanceDto,
  CreateClientPaymentDto,
  CreateInvoicePaymentDto,
  ListBalancesQueryDto,
  ListCreditLimitsQueryDto,
  ListInvoicePaymentsQueryDto,
} from './dto/receivables.dto.js';
import {
  dateRange,
  fetchBriloList,
  fetchBriloPage,
  parsePaging,
} from './finance-paging.js';
import type {
  BriloAbonoFacturaConsulta,
  BriloBancoAnticipo,
  BriloLimiteCredito,
  BriloSaldoCxcCliente,
  BriloTipoAbonoVenta,
  BriloTipoAnticipoVenta,
} from './finance.types.js';

function optional(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

/** Brilo expects a full ISO timestamp for `fechaAbono`. */
function toBriloDateTime(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toISOString();
}

@Injectable()
export class ReceivablesService {
  constructor(private readonly brilo: BriloWebapiService) {}

  listBalances(query: ListBalancesQueryDto) {
    return fetchBriloPage<BriloSaldoCxcCliente>(
      this.brilo,
      '/v2/CXC/GetSaldoCuentaXCobrarCliente',
      parsePaging(query, 25),
      { cliNumero: optional(query.clientCode) },
    );
  }

  listCreditLimits(query: ListCreditLimitsQueryDto) {
    return fetchBriloPage<BriloLimiteCredito>(
      this.brilo,
      '/v2/CXC/LimitesCreditoClientes',
      parsePaging(query, 50),
      { cliNumero: optional(query.clientCode) },
    );
  }

  listInvoicePayments(query: ListInvoicePaymentsQueryDto) {
    return fetchBriloPage<BriloAbonoFacturaConsulta>(
      this.brilo,
      '/v2/CXC/GetAbonosFacturas',
      parsePaging(query, 50),
      {
        cliNumero: optional(query.clientCode),
        NumFactura: optional(query.invoiceNumber),
        ...dateRange(query.from, query.to),
      },
    );
  }

  async getCatalogs() {
    const [paymentTypes, advanceTypes, banks] = await Promise.all([
      fetchBriloList<BriloTipoAbonoVenta>(
        this.brilo,
        '/v2/Ventas/TiposAbonoVenta',
      ),
      fetchBriloList<BriloTipoAnticipoVenta>(
        this.brilo,
        '/v2/Ventas/TiposAnticipoVenta',
      ),
      fetchBriloList<BriloBancoAnticipo>(
        this.brilo,
        '/v2/Ventas/BancosAnticipo',
      ),
    ]);
    return { paymentTypes, advanceTypes, banks };
  }

  async createInvoicePayment(dto: CreateInvoicePaymentDto) {
    const { data } = await this.brilo.send('POST', '/v2/CXC/AbonoFactura', {
      body: {
        fechaAbono: toBriloDateTime(dto.date),
        valorAbonoPropio: dto.amount,
        tipoAbono: dto.paymentTypeCode.trim(),
        tipoFactura: dto.invoiceType.trim(),
        numFactura: dto.invoiceNumber.trim(),
        numDocAbono: optional(dto.paymentDocNumber),
        bcoCodigo: optional(dto.bankCode),
        observaciones: optional(dto.notes),
      },
    });
    return unwrapSingle<BriloAbonoFacturaConsulta>(data);
  }

  async createClientPayment(dto: CreateClientPaymentDto) {
    const { data } = await this.brilo.send('POST', '/v2/CXC/AbonoCliente', {
      body: {
        cliNumero: dto.clientCode.trim(),
        monto: dto.amount,
        fechaAbono: toBriloDateTime(dto.date),
        tipoAbono: dto.paymentTypeCode.trim(),
        tanvCodigo: optional(dto.advanceTypeCode),
        numDocAbono: optional(dto.paymentDocNumber),
        bcoCodigo: optional(dto.bankCode),
        observaciones: optional(dto.notes),
      },
    });
    return unwrapSingle(data);
  }

  async createAdvance(dto: CreateAdvanceDto) {
    const { data } = await this.brilo.send('POST', '/v2/CXC/AnticipoVenta', {
      body: {
        cliNumero: dto.clientCode.trim(),
        monto: dto.amount,
        tanvCodigo: dto.advanceTypeCode.trim(),
        tipoAbono: dto.paymentTypeCode.trim(),
        numDocVenta: optional(dto.saleDocNumber),
        numDocAbono: optional(dto.paymentDocNumber),
        bcoCodigo: optional(dto.bankCode),
        observaciones: optional(dto.notes),
      },
    });
    return unwrapSingle(data);
  }
}
