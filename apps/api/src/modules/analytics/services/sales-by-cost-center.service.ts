import { Injectable } from '@nestjs/common';
import { BriloDatabaseService } from '../../brilo-database/brilo-database.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

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
  tipoVentaId: number | null;
  tipoVentaName: string;
  sellerId: number | null;
  sellerCode: string | null;
  sellerName: string;
}

export interface SalesByCostCenterReport {
  range: { from: string; to: string };
  total: number;
  rows: SalesByCostCenterRow[];
}

export interface SellerNameMatch {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface BriloSalesRow {
  mfaId: number;
  mfaGUID: string | null;
  mfaTipoDoc: string;
  mfaNumDoc: string | null;
  mfaFecha: Date;
  Total: number | null;
  cliId: number | null;
  Cliente: string | null;
  cecoIdDet: number | null;
  cecoCodigoDet: string | null;
  CentroCostoDet: string | null;
  cecoIdSubDet: number | null;
  cecoCodigoSubDet: string | null;
  SubCentroCostoDet: string | null;
  tvesId: number | null;
  TipoVenta: string | null;
  vndId: number | null;
  vndCodigo: string | null;
  vndNombres: string | null;
  vndApellidos: string | null;
}

const SALES_BY_COST_CENTER_SQL = `
SELECT
    mf.mfaId,
    mf.mfaGUID,
    mf.mfaTipoDoc,
    mf.mfaNumDoc,
    mf.mfaFecha,
    cli.cliId,
    cli.cliNombres AS Cliente,
    cecoDet.cecoId AS cecoIdDet,
    cecoDet.cecoCodigo AS cecoCodigoDet,
    cecoDet.cecoNombre AS CentroCostoDet,
    cecoSubDet.cecoId AS cecoIdSubDet,
    cecoSubDet.cecoCodigo AS cecoCodigoSubDet,
    cecoSubDet.cecoNombre AS SubCentroCostoDet,
    tves.tvesId,
    tves.tvesNombre AS TipoVenta,
    vnd.vndId,
    vnd.vndCodigo,
    vnd.vndNombres,
    vnd.vndApellidos,
    SUM(
        (
            CASE
                WHEN df.dfaExento = 1 THEN
                    ISNULL(df.dfaTotalLinea, df.dfaPrecio * df.dfaCantidad * (1.0 - ISNULL(df.dfaPorcentDesc, 0) / 100.0))
                ELSE
                    ISNULL(df.dfaTotalLinea, df.dfaPrecio * df.dfaCantidad * (1.0 - ISNULL(df.dfaPorcentDesc, 0) / 100.0))
                    * (1.0 + ISNULL(mf.mfaPorcentIVA, 0) / 100.0)
            END
            + ISNULL(impLine.impuestosLinea, 0)
        ) * ISNULL(tdv.tdvnSignoVenta, 1)
    ) AS Total
FROM olVentas.dbo.detFacturas df WITH (NOLOCK)
INNER JOIN olVentas.dbo.maeFacturas mf WITH (NOLOCK)
    ON mf.mfaId = df.mfaId
LEFT JOIN olVentas.dbo.TiposDocVen tdv WITH (NOLOCK)
    ON tdv.tdvnCodigo = mf.mfaTipoDoc
LEFT JOIN olVentas.dbo.TiposVentasEspec tves WITH (NOLOCK)
    ON tves.tvesId = mf.tvesId
LEFT JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON cli.cliId = mf.cliIdInvoiceTo
LEFT JOIN olComun.dbo.CentrosCosto cecoDet WITH (NOLOCK)
    ON cecoDet.cecoId = df.cecoId
LEFT JOIN olComun.dbo.CentrosCosto cecoSubDet WITH (NOLOCK)
    ON cecoSubDet.cecoId = df.cecoIdSub
LEFT JOIN olComun.dbo.Vendedores vnd WITH (NOLOCK)
    ON vnd.vndId = mf.vndId
OUTER APPLY (
    SELECT SUM(impdf.impdfValorImpuesto * impdf.impdfSignoImpuesto) AS impuestosLinea
    FROM olVentas.dbo.impdetFacturas impdf WITH (NOLOCK)
    WHERE impdf.dfaId = df.dfaId
      AND impdf.impdfHabilitado = 1
) AS impLine
WHERE mf.mfaFecha >= @FechaInicio
  AND mf.mfaFecha < @FechaFin
  AND mf.mfaAnulada = 0
  AND mf.mfaPosteada = 1
  AND mf.mfaTipoDoc IN ('CCF', 'FCF', 'NDC')
  AND (
      @ApplyVendedorFilter = 0
      OR (
          vnd.vndId IS NOT NULL
          AND (ISNULL(vnd.vndNombres, '') + ' ' + ISNULL(vnd.vndApellidos, '')) LIKE @VToken1Like ESCAPE '\\'
          AND (@VTokenCount < 2 OR (ISNULL(vnd.vndNombres, '') + ' ' + ISNULL(vnd.vndApellidos, '')) LIKE @VToken2Like ESCAPE '\\')
          AND (@VTokenCount < 3 OR (ISNULL(vnd.vndNombres, '') + ' ' + ISNULL(vnd.vndApellidos, '')) LIKE @VToken3Like ESCAPE '\\')
          AND (@VTokenCount < 4 OR (ISNULL(vnd.vndNombres, '') + ' ' + ISNULL(vnd.vndApellidos, '')) LIKE @VToken4Like ESCAPE '\\')
      )
  )
GROUP BY
    mf.mfaId, mf.mfaGUID, mf.mfaTipoDoc, mf.mfaNumDoc, mf.mfaFecha,
    cli.cliId, cli.cliNombres,
    cecoDet.cecoId, cecoDet.cecoCodigo, cecoDet.cecoNombre,
    cecoSubDet.cecoId, cecoSubDet.cecoCodigo, cecoSubDet.cecoNombre,
    tves.tvesId, tves.tvesNombre,
    vnd.vndId, vnd.vndCodigo, vnd.vndNombres, vnd.vndApellidos
ORDER BY
    cecoDet.cecoNombre ASC,
    cecoSubDet.cecoNombre ASC,
    tves.tvesNombre ASC,
    vnd.vndNombres ASC,
    vnd.vndApellidos ASC,
    cli.cliNombres ASC,
    mf.mfaFecha ASC;
`;

const MIN_VENDEDOR_NAME_TOKEN_LENGTH = 2;
const MAX_VENDEDOR_NAME_TOKENS = 4;

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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_[]/g, (char) => `\\${char}`);
}

function sellerNameMatchFromParts(parts: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): SellerNameMatch | null {
  const fullName = parts.fullName?.trim() || null;
  const firstName = parts.firstName?.trim() || null;
  const lastName = parts.lastName?.trim() || null;

  if (!fullName && !firstName && !lastName) return null;
  return { fullName, firstName, lastName };
}

function buildSellerNameTokens(match: SellerNameMatch): string[] {
  const firstName = match.firstName?.trim() ?? '';
  const lastName = match.lastName?.trim() ?? '';

  if (firstName && lastName) {
    return [firstName, lastName].filter(
      (t) => t.length >= MIN_VENDEDOR_NAME_TOKEN_LENGTH,
    );
  }

  const source = match.fullName?.trim() || firstName || lastName;
  return source
    .split(/\s+/)
    .filter((t) => t.length >= MIN_VENDEDOR_NAME_TOKEN_LENGTH)
    .slice(0, MAX_VENDEDOR_NAME_TOKENS);
}

function buildVendedorSqlParams(match?: SellerNameMatch | null) {
  const emptyTokens = {
    ApplyVendedorFilter: 0,
    VTokenCount: 0,
    VToken1Like: '%',
    VToken2Like: '%',
    VToken3Like: '%',
    VToken4Like: '%',
  };

  if (!match) return emptyTokens;

  const tokens = buildSellerNameTokens(match);
  if (tokens.length === 0) return emptyTokens;

  return {
    ApplyVendedorFilter: 1,
    VTokenCount: tokens.length,
    VToken1Like: `%${escapeLikePattern(tokens[0]!)}%`,
    VToken2Like: tokens[1] ? `%${escapeLikePattern(tokens[1])}%` : '%',
    VToken3Like: tokens[2] ? `%${escapeLikePattern(tokens[2])}%` : '%',
    VToken4Like: tokens[3] ? `%${escapeLikePattern(tokens[3])}%` : '%',
  };
}

function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable()
export class SalesByCostCenterService {
  constructor(
    private readonly brilo: BriloDatabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async getReport(
    from: Date,
    to: Date,
    options?: { sellerNameMatch?: SellerNameMatch | null },
  ): Promise<SalesByCostCenterReport> {
    const exclusiveTo = new Date(to.getTime());
    exclusiveTo.setUTCDate(exclusiveTo.getUTCDate() + 1);

    const vendedorParams = buildVendedorSqlParams(options?.sellerNameMatch);

    const rows = await this.brilo.query<BriloSalesRow>(
      SALES_BY_COST_CENTER_SQL,
      {
        FechaInicio: from,
        FechaFin: exclusiveTo,
        ...vendedorParams,
      },
    );

    const mapped = rows.map((r): SalesByCostCenterRow => {
      return {
        invoiceId: Number(r.mfaId),
        guid: r.mfaGUID ?? '',
        documentType: r.mfaTipoDoc,
        documentNumber: r.mfaNumDoc,
        date: r.mfaFecha,
        customerId: r.cliId ?? null,
        customerName: cleanName(r.Cliente) || 'Sin cliente',
        total: round2(Number(r.Total ?? 0)),
        costCenterId: r.cecoIdDet ?? null,
        costCenterCode: r.cecoCodigoDet ?? null,
        costCenterName:
          cleanName(r.CentroCostoDet) || 'Centro de Costos- N/A',
        subCostCenterId: r.cecoIdSubDet ?? null,
        subCostCenterCode: r.cecoCodigoSubDet ?? null,
        subCostCenterName:
          cleanName(r.SubCentroCostoDet) || 'Sub Centro de Costos- N/A',
        tipoVentaId: r.tvesId ?? null,
        tipoVentaName: cleanName(r.TipoVenta) || 'Tipo de Venta- N/A',
        sellerId: r.vndId ?? null,
        sellerCode: r.vndCodigo ?? null,
        sellerName: composeSellerName(r.vndNombres, r.vndApellidos),
      };
    });

    const total = round2(mapped.reduce((sum, r) => sum + r.total, 0));

    return {
      range: { from: formatDate(from), to: formatDate(to) },
      total,
      rows: mapped,
    };
  }

  async getMyReport(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<SalesByCostCenterReport> {
    const sellerNameMatch = await this.resolveSellerNameMatch(userId);
    if (!sellerNameMatch) {
      return {
        range: { from: formatDate(from), to: formatDate(to) },
        total: 0,
        rows: [],
      };
    }
    return this.getReport(from, to, { sellerNameMatch });
  }

  private async resolveSellerNameMatch(
    userId: string,
  ): Promise<SellerNameMatch | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: { userId },
      select: {
        fullName: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });

    if (member) {
      const match = sellerNameMatchFromParts({
        fullName: member.fullName,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
      });
      if (match) return match;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    if (!user) return null;

    return sellerNameMatchFromParts({
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }
}
