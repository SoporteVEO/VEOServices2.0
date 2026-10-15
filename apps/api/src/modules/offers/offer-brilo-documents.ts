/**
 * Builds the Brilo cotización and contrato that back the billing of an accepted
 * offer. Only static billboard lines exist in Brilo's Vallas module, so digital
 * screens and misc concepts never leave VEO.
 */
import { OfferItemType } from '@prisma/client';
import type {
  BriloContratoInput,
  BriloCotizacionInput,
} from '../brilo-webapi/brilo-webapi.types.js';
import {
  localIsoDate,
  todayIso,
} from '../digital-billboards/pantallas-rules.js';
import { rentalPeriods } from './offer-contract.js';

/** `olVallas.dbo.GetMcotEstado`: 2 = Aceptada. */
const BRILO_COTIZACION_ACEPTADA = 2;
const BRILO_MONTHLY_PERIODICITY = 'mm';

const BRILO_CLIENT_COLUMNS = `
    cli.cliId,
    cli.cliNumero,
    cli.cliNombres,
    cli.cliNomComercial,
    cli.cliNit,
    cli.cliEmail`;

export const BRILO_CLIENTS_BY_EMAIL_SQL = `
SELECT TOP (10) ${BRILO_CLIENT_COLUMNS}
FROM olComun.dbo.Clientes cli WITH (NOLOCK)
WHERE LOWER(LTRIM(RTRIM(cli.cliEmail))) IN (@Email1, @Email2)
   OR LOWER(LTRIM(RTRIM(cli.cliEmailFacturacion))) IN (@Email1, @Email2)
   OR LOWER(LTRIM(RTRIM(cli.cliEmailAdicional))) IN (@Email1, @Email2)
ORDER BY cli.cliId DESC
`;

export const BRILO_CLIENTS_SEARCH_SQL = `
SELECT ${BRILO_CLIENT_COLUMNS},
    COUNT(*) OVER () AS totalCount
FROM olComun.dbo.Clientes cli WITH (NOLOCK)
WHERE @Search = ''
   OR cli.cliNombres LIKE @SearchLike ESCAPE '\\'
   OR cli.cliNomComercial LIKE @SearchLike ESCAPE '\\'
   OR cli.cliNumero LIKE @SearchLike ESCAPE '\\'
   OR cli.cliNit LIKE @SearchLike ESCAPE '\\'
   OR cli.cliEmail LIKE @SearchLike ESCAPE '\\'
ORDER BY cli.cliNombres ASC, cli.cliId ASC
OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
`;

export const BRILO_CLIENT_BY_ID_SQL = `
SELECT ${BRILO_CLIENT_COLUMNS}
FROM olComun.dbo.Clientes cli WITH (NOLOCK)
WHERE cli.cliId = @CliId
`;

export const BRILO_ACTIVE_EXECUTIVES_SQL = `
SELECT ej.ejecId, ej.ejecCodigo, ej.ejecNombre
FROM olVallas.dbo.Ejecutivos ej WITH (NOLOCK)
WHERE ej.ejecActivo = 1
ORDER BY ej.ejecNombre ASC
`;

export const BRILO_COTIZACION_BY_ID_SQL = `
SELECT cot.mcotId, cot.mcotNumero
FROM olVallas.dbo.maeCotizaciones cot WITH (NOLOCK)
WHERE cot.mcotId = @McotId
`;

export interface BriloClientRow {
  cliId: number;
  cliNumero: string | null;
  cliNombres: string | null;
  cliNomComercial: string | null;
  cliNit: string | null;
  cliEmail: string | null;
}

export interface BriloClientOption {
  cliId: number;
  cliNumero: string | null;
  name: string;
  commercialName: string | null;
  nit: string | null;
  email: string | null;
}

export interface BriloExecutiveOption {
  ejecId: number;
  ejecCodigo: string | null;
  ejecNombre: string;
}

export function toBriloClientOption(row: BriloClientRow): BriloClientOption {
  const name = row.cliNombres?.trim() || row.cliNomComercial?.trim() || '';
  return {
    cliId: row.cliId,
    cliNumero: row.cliNumero?.trim() || null,
    name,
    commercialName: row.cliNomComercial?.trim() || null,
    nit: row.cliNit?.trim() || null,
    email: row.cliEmail?.trim() || null,
  };
}

function nameTokens(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Brilo stores short executive names ("Luis Segovia") while VEO keeps the full
 * name ("Luis Alberto Segovia Pérez"), so an executive matches when every word
 * of the shorter name appears in the longer one, ignoring accents and case.
 */
export function matchExecutivesByName(
  fullName: string | null | undefined,
  executives: BriloExecutiveOption[],
): BriloExecutiveOption[] {
  const advisor = nameTokens(fullName ?? '');
  if (advisor.length === 0) return [];
  const advisorSet = new Set(advisor);

  return executives.filter((executive) => {
    const tokens = nameTokens(executive.ejecNombre);
    if (tokens.length === 0) return false;
    const [shorter, longerSet] =
      tokens.length <= advisor.length
        ? [tokens, advisorSet]
        : [advisor, new Set(tokens)];
    return shorter.every((token) => longerSet.has(token));
  });
}

export interface BriloOfferItem {
  itemType: OfferItemType;
  billboardId: number | null;
  quantity: number;
  impressionPrice: number;
  rentalPrice: number;
  startDate: Date | null;
  endDate: Date | null;
}

export interface BriloStaticItem extends BriloOfferItem {
  billboardId: number;
}

export function briloStaticItems<
  T extends Pick<BriloOfferItem, 'itemType' | 'billboardId'>,
>(items: T[]): Array<T & { billboardId: number }> {
  return items.filter(
    (item): item is T & { billboardId: number } =>
      item.itemType === OfferItemType.STATIC_BILLBOARD &&
      item.billboardId != null,
  );
}

export interface BriloDocumentHeader {
  offerNumber: string;
  customerName: string;
  customerContact: string | null;
  cliId: number;
  ejecId: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function briloDate(isoDate: string): string {
  return `${isoDate}T00:00:00`;
}

function briloItemDate(date: Date | null): string | null {
  return date ? briloDate(localIsoDate(date)) : null;
}

/** Brilo bills rent per month before IVA; VEO stores it for the whole period. */
export function briloMonthlyRent(item: BriloOfferItem): number {
  return round2(
    (item.rentalPrice * item.quantity) /
      rentalPeriods(item.startDate, item.endDate),
  );
}

function briloImpression(item: BriloOfferItem): number | null {
  const total = round2(item.impressionPrice * item.quantity);
  return total > 0 ? total : null;
}

function observations(header: BriloDocumentHeader): string {
  return `Generado desde VEO Services, cotización ${header.offerNumber}`;
}

function attention(header: BriloDocumentHeader): string | null {
  return header.customerContact?.trim() || header.customerName.trim() || null;
}

export function buildBriloCotizacion(
  header: BriloDocumentHeader,
  items: BriloStaticItem[],
): BriloCotizacionInput {
  const today = briloDate(todayIso());
  return {
    mcotId: 0,
    cliId: header.cliId,
    ejecId: header.ejecId,
    mcotFechaRegistro: today,
    mcotEstado: BRILO_COTIZACION_ACEPTADA,
    mcotFechaAceptacion: today,
    mcotIncAgencia: false,
    mcotConsolidarPrecio: false,
    mcotObservaciones: observations(header),
    mcotAtencionA: attention(header),
    detalles: items.map((item) => ({
      dcotId: 0,
      mcotId: 0,
      caraId: item.billboardId,
      dcotCostoArrendamiento: briloMonthlyRent(item),
      dcotCostoImpresion: briloImpression(item),
      dcotFechaDesde: briloItemDate(item.startDate),
      dcotFechaHasta: briloItemDate(item.endDate),
      dcotAceptada: true,
      dcotEsCircuito: false,
      dcotConsolidaPorSitio: false,
    })),
  };
}

export function buildBriloContrato(
  header: BriloDocumentHeader,
  items: BriloStaticItem[],
  mcotId: number,
): BriloContratoInput {
  const today = briloDate(todayIso());
  const starts = items
    .map((item) => item.startDate)
    .filter((d): d is Date => d != null);
  const ends = items
    .map((item) => item.endDate)
    .filter((d): d is Date => d != null);

  return {
    mconId: 0,
    mcotId,
    cliId: header.cliId,
    ejecId: header.ejecId,
    mconFecha: today,
    mconFechaInicio: starts.length
      ? briloItemDate(new Date(Math.min(...starts.map((d) => d.getTime()))))
      : null,
    mconFechaFin: ends.length
      ? briloItemDate(new Date(Math.max(...ends.map((d) => d.getTime()))))
      : null,
    mconPosteado: true,
    mconAnulado: false,
    mconRequiereInstalacion: items.some((item) => item.impressionPrice > 0),
    mconObservaciones: observations(header),
    mconAtencionA: attention(header),
    mconFrecuenciaCuotas: 1,
    mconPeriodicidadCuotas: BRILO_MONTHLY_PERIODICITY,
    mconFecCuotaInicial: today,
    detalles: items.map((item) => ({
      dconId: 0,
      mconId: 0,
      caraId: item.billboardId,
      dconCostoArrendamiento: briloMonthlyRent(item),
      dconCostoImpresion: briloImpression(item),
      dconFechaDesde: briloItemDate(item.startDate),
      dconFechaHasta: briloItemDate(item.endDate),
      dconConsolidaPorSitio: false,
    })),
  };
}
