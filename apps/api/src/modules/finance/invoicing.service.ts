import { Injectable, NotFoundException } from '@nestjs/common';
import { unwrapList, unwrapSingle } from '../brilo-webapi/brilo-response.js';
import { BriloWebapiService } from '../brilo-webapi/brilo-webapi.service.js';
import type {
  ListInvoicesQueryDto,
  ListOrdersQueryDto,
  SendOrderEmailDto,
} from './dto/invoicing.dto.js';
import {
  dateRange,
  fetchBriloList,
  parsePaging,
  toPage,
} from './finance-paging.js';
import type {
  BriloAbonoFacturaConsulta,
  BriloDestinatarioSugerido,
  BriloEnviarEmailResult,
  BriloFactura,
  BriloHistoricoEmail,
  BriloOdfDetalle,
  BriloOdfListado,
} from './finance.types.js';

function withoutLines(invoice: BriloFactura): BriloFactura {
  return { ...invoice, detFactura: undefined };
}

@Injectable()
export class InvoicingService {
  constructor(private readonly brilo: BriloWebapiService) {}

  async listInvoices(query: ListInvoicesQueryDto) {
    const paging = parsePaging(query, 25);
    const clientCode = query.clientCode?.trim();
    const { data, total } = await this.brilo.send(
      'GET',
      '/v2/Ventas/Facturas',
      {
        query: {
          mfaNumDoc: query.number?.trim() || undefined,
          cliNumero: clientCode ? [clientCode] : undefined,
          incluye_saldo: true,
          ...dateRange(query.from, query.to),
          page: paging.page,
          per_page: paging.pageSize,
        },
      },
    );
    const invoices = unwrapList<BriloFactura>(data).map(withoutLines);
    return toPage(invoices, paging, total);
  }

  async getInvoice(mfaId: number) {
    const [invoiceRes, payments] = await Promise.all([
      this.brilo.send('GET', '/v2/Ventas/Factura', {
        query: { mfaId, incluye_saldo: true },
      }),
      fetchBriloList<BriloAbonoFacturaConsulta>(
        this.brilo,
        '/v2/CXC/GetAbonosFacturas',
        { mfaId, per_page: 200 },
      ),
    ]);
    const [invoice] = unwrapList<BriloFactura>(invoiceRes.data);
    if (!invoice) throw new NotFoundException('Factura no encontrada.');
    return { invoice, payments };
  }

  async listOrders(query: ListOrdersQueryDto) {
    const paging = parsePaging(query, 25);
    const { data, total } = await this.brilo.send('GET', '/v2/Ventas/ODFs', {
      query: {
        tipoDoc: query.docType ?? 'OFS',
        estado: query.status,
        scope: query.scope ?? 'todos',
        texto: query.search?.trim() || undefined,
        ...dateRange(query.from, query.to),
        page: paging.page,
        per_page: paging.pageSize,
      },
    });
    const listing = unwrapSingle<BriloOdfListado>(data);
    return {
      ...toPage(listing.items ?? [], paging, listing.total ?? total),
      counts: listing.conteos ?? null,
      truncated: listing.truncado ?? false,
    };
  }

  async getOrder(mfaId: number) {
    const { data } = await this.brilo.send('GET', `/v2/Ventas/ODF/${mfaId}`);
    const detail = unwrapSingle<BriloOdfDetalle>(data);
    const document = Array.isArray(detail.documento)
      ? detail.documento[0]
      : detail.documento;
    if (!document)
      throw new NotFoundException('Orden de facturación no encontrada.');
    return { order: document, totals: detail.totales ?? null };
  }

  getOrderPdf(mfaId: number) {
    return this.brilo.fetchFile(`/v2/Ventas/ODF/${mfaId}/Pdf`);
  }

  async finalizeOrder(mfaId: number) {
    const { data } = await this.brilo.send(
      'PUT',
      `/v2/Ventas/ODF/${mfaId}/Finalizar`,
    );
    return unwrapSingle<BriloFactura>(data);
  }

  async getOrderEmails(mfaId: number) {
    const [history, suggested] = await Promise.all([
      fetchBriloList<BriloHistoricoEmail>(
        this.brilo,
        `/v2/Ventas/ODF/${mfaId}/Email/Historico`,
      ),
      fetchBriloList<BriloDestinatarioSugerido>(
        this.brilo,
        `/v2/Ventas/ODF/${mfaId}/Email/DestinatariosSugeridos`,
      ),
    ]);
    return { history, suggested };
  }

  async sendOrderEmail(mfaId: number, dto: SendOrderEmailDto) {
    const { data } = await this.brilo.send(
      'POST',
      `/v2/Ventas/ODF/${mfaId}/Email`,
      {
        body: {
          destinatarios: dto.recipients.map((r) => ({
            email: r.email.trim(),
            tipoEnvio: r.sendType,
          })),
          incluirVendedor: dto.includeSeller ?? false,
          incluirMiEmail: dto.includeMe ?? false,
          ...(dto.replyTo ? { replyTo: dto.replyTo.trim() } : {}),
        },
      },
    );
    return unwrapSingle<BriloEnviarEmailResult>(data);
  }
}
