import { Injectable } from '@nestjs/common';
import { BriloDatabaseService } from '../../brilo-database/brilo-database.service.js';

export interface SalesByCostCenterRow {
  invoiceId: number;
  guid: string;
  documentType: string;
  documentNumber: string | null;
  date: Date;
  customerId: number | null;
  customerName: string;
  total: number;
  costCenterId: number | null;
  costCenterCode: string | null;
  costCenterName: string;
  subCostCenterId: number | null;
  subCostCenterCode: string | null;
  subCostCenterName: string | null;
  sellerId: number | null;
  sellerCode: string | null;
  sellerName: string;
}

export interface SalesByCostCenterReport {
  range: { from: string; to: string };
  total: number;
  rows: SalesByCostCenterRow[];
}

interface BriloSalesRow {
  mfaId: number;
  mfaGUID: string | null;
  mfaTipoDoc: string;
  mfaNumDoc: string | null;
  mfaFecha: Date;
  mfaSumasAfecto: number | null;
  mfaSumasExento: number | null;
  tdvnSignoVenta: number | null;
  cliId: number | null;
  Cliente: string | null;
  cecoId: number | null;
  cecoCodigo: string | null;
  CentroCosto: string | null;
  cecoIdSub: number | null;
  cecoCodigoSub: string | null;
  SubCentroCosto: string | null;
  vndId: number | null;
  vndCodigo: string | null;
  vndNombres: string | null;
  vndApellidos: string | null;
}

const VEO_COST_CENTER_ID = 7;

const SALES_BY_COST_CENTER_SQL = `
SELECT
    mf.mfaId,
    mf.mfaGUID,
    mf.mfaTipoDoc,
    mf.mfaNumDoc,
    mf.mfaFecha,
    mf.mfaSumasAfecto,
    mf.mfaSumasExento,
    tdv.tdvnSignoVenta,
    cli.cliId,
    cli.cliNombres AS Cliente,
    ceco.cecoId,
    ceco.cecoCodigo,
    ceco.cecoNombre AS CentroCosto,
    cecoSub.cecoId AS cecoIdSub,
    cecoSub.cecoCodigo AS cecoCodigoSub,
    cecoSub.cecoNombre AS SubCentroCosto,
    vnd.vndId,
    vnd.vndCodigo,
    vnd.vndNombres,
    vnd.vndApellidos
FROM olVentas.dbo.maeFacturas mf WITH (NOLOCK)
LEFT JOIN olVentas.dbo.TiposDocVen tdv WITH (NOLOCK)
    ON tdv.tdvnCodigo = mf.mfaTipoDoc
LEFT JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON cli.cliId = mf.cliIdInvoiceTo
LEFT JOIN olComun.dbo.CentrosCosto ceco WITH (NOLOCK)
    ON ceco.cecoId = mf.cecoId
LEFT JOIN olComun.dbo.CentrosCosto cecoSub WITH (NOLOCK)
    ON cecoSub.cecoId = mf.cecoIdSub
LEFT JOIN olComun.dbo.Vendedores vnd WITH (NOLOCK)
    ON vnd.vndId = mf.vndId
WHERE mf.mfaFecha >= @FechaInicio
  AND mf.mfaFecha < @FechaFin
  AND mf.mfaAnulada = 0
  AND mf.mfaPosteada = 1
  AND mf.cecoId = @CecoId
  AND mf.mfaTipoDoc IN ('CCF', 'FCF', 'NDC')
ORDER BY
    ceco.cecoNombre ASC,
    cecoSub.cecoNombre ASC,
    vnd.vndNombres ASC,
    vnd.vndApellidos ASC,
    cli.cliNombres ASC,
    mf.mfaFecha ASC;
`;

function cleanName(value: string | null | undefined): string {
  if (value == null) return '';
  return value.replace(/\s+/g, ' ').trim();
}

function composeSellerName(
  nombres: string | null,
  apellidos: string | null,
): string {
  const first = cleanName(nombres);
  const last = cleanName(apellidos);
  const full = [first, last].filter(Boolean).join(' ');
  return full || 'Sin vendedor';
}

@Injectable()
export class SalesByCostCenterService {
  constructor(private readonly brilo: BriloDatabaseService) {}

  async getReport(from: Date, to: Date): Promise<SalesByCostCenterReport> {
    const exclusiveTo = new Date(to.getTime());
    exclusiveTo.setUTCDate(exclusiveTo.getUTCDate() + 1);

    const rows = await this.brilo.query<BriloSalesRow>(
      SALES_BY_COST_CENTER_SQL,
      {
        FechaInicio: from,
        FechaFin: exclusiveTo,
        CecoId: VEO_COST_CENTER_ID,
      },
    );

    const mapped = rows.map((r): SalesByCostCenterRow => {
      const sign = r.tdvnSignoVenta ?? 1;
      const subtotal =
        Number(r.mfaSumasAfecto ?? 0) + Number(r.mfaSumasExento ?? 0);
      const total = Math.round(subtotal * sign * 100) / 100;

      return {
        invoiceId: Number(r.mfaId),
        guid: r.mfaGUID ?? '',
        documentType: r.mfaTipoDoc,
        documentNumber: r.mfaNumDoc,
        date: r.mfaFecha,
        customerId: r.cliId ?? null,
        customerName: cleanName(r.Cliente) || 'Sin cliente',
        total,
        costCenterId: r.cecoId ?? null,
        costCenterCode: r.cecoCodigo ?? null,
        costCenterName: cleanName(r.CentroCosto) || 'Sin centro de costo',
        subCostCenterId: r.cecoIdSub ?? null,
        subCostCenterCode: r.cecoCodigoSub ?? null,
        subCostCenterName: r.SubCentroCosto
          ? cleanName(r.SubCentroCosto)
          : null,
        sellerId: r.vndId ?? null,
        sellerCode: r.vndCodigo ?? null,
        sellerName: composeSellerName(r.vndNombres, r.vndApellidos),
      };
    });

    const total =
      Math.round(mapped.reduce((sum, r) => sum + r.total, 0) * 100) / 100;

    const formatDate = (d: Date): string => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      range: { from: formatDate(from), to: formatDate(to) },
      total,
      rows: mapped,
    };
  }
}
