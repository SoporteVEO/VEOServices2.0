/**
 * Everything needed to print the lease contract that follows an accepted offer.
 *
 * The amounts are computed here rather than in the browser on purpose: the
 * contract is a legal document, so the figures a client signs must come from one
 * place that is covered by tests, not from arithmetic repeated per client.
 */

/** Brilo is the system of record for the contract code and the client's legal data. */
export const BRILO_CONTRACT_WITH_CLIENT_SQL = `
SELECT
    maecon.mconCodigo,
    maecon.mconFecha,
    cli.cliNombres,
    cli.cliNomComercial,
    cli.cliNomRepLegal,
    cli.cliNumIdentifRepLegal,
    cli.cliDireccion,
    cli.cliCiudadMuni,
    cli.cliDeptoEstado,
    cli.cliEmail,
    cli.cliEmailFacturacion
FROM olVallas.dbo.maeContratos maecon WITH (NOLOCK)
LEFT JOIN olComun.dbo.Clientes cli WITH (NOLOCK)
    ON cli.cliId = maecon.cliId
WHERE maecon.mconId = @MconId
  AND maecon.mconPosteado <> 0
  AND maecon.mconAnulado <> 1
`;

export interface BriloContractWithClientRow {
  mconCodigo: string;
  mconFecha: Date;
  cliNombres: string | null;
  cliNomComercial: string | null;
  cliNomRepLegal: string | null;
  cliNumIdentifRepLegal: string | null;
  cliDireccion: string | null;
  cliCiudadMuni: string | null;
  cliDeptoEstado: string | null;
  cliEmail: string | null;
  cliEmailFacturacion: string | null;
}

/** The client side of the contract, as named in the opening paragraph. */
export interface OfferContractClient {
  /** Legal name that signs, e.g. "ESPACIOS PUBLICITARIOS S.A. DE C.V." */
  companyName: string;
  /** Who signs for the company, e.g. "LIC. ROBERTO HENRIQUEZ". */
  legalRepName: string;
  /** DUI of the signer. Null keeps the blank line the template prints. */
  legalRepDui: string | null;
  /** Domicile named in the opening paragraph, e.g. "San Salvador". */
  domicile: string | null;
  /** Address of record, used when the domicile is unknown. */
  address: string | null;
  /** Where written notices go, per clause VI. */
  notificationEmail: string | null;
}

export interface OfferContractBillboard {
  /** Contract wording for the structure, derived from the code prefix. */
  vallaType: string;
  code: string;
  location: string;
  /** Pre-formatted "alto x ancho", blank when either side is unknown. */
  dimensions: string;
  monthlyCost: number;
  startDate: string | null;
  endDate: string | null;
}

export interface OfferContractData {
  offerId: string;
  offerNumber: string;
  contractNumber: string;
  /** Dateline of the contract, taken from the Brilo contract. */
  contractDate: string;
  client: OfferContractClient;
  billboardCount: number;
  monthlyRentalTotal: number;
  contractTotal: number;
  /** Earliest start and latest end across the billboards on the contract. */
  startDate: string | null;
  endDate: string | null;
  billboards: OfferContractBillboard[];
  hasArchivedPdf: boolean;
}

/**
 * Contract wording for each billboard-code prefix. Brilo exposes no type
 * catalogue we can join, so the prefix is the only signal available. An unmapped
 * prefix prints as itself rather than as a guessed word, because a wrong
 * structure type on a signed lease is worse than a terse one.
 */
const VALLA_TYPE_BY_PREFIX: Record<string, string> = {
  TR: 'TORRES',
};

export function vallaTypeFromCode(code: string | null | undefined): string {
  const prefix = code?.trim().toUpperCase().match(/^[A-Z]+/)?.[0];
  if (!prefix) return '';
  return VALLA_TYPE_BY_PREFIX[prefix] ?? prefix;
}

/**
 * Billable months in a lease period. A period that ends on or after the
 * day-of-month it started counts its final month in full, which is how
 * 1/9 → 30/11 bills as three months rather than two.
 */
export function billableMonths(start: Date, end: Date): number {
  const wholeMonths =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  const endsOnOrAfterStartDay = end.getUTCDate() >= start.getUTCDate();
  return Math.max(1, wholeMonths + (endsOnOrAfterStartDay ? 1 : 0));
}

export function formatDimensions(
  height: number | null,
  width: number | null,
): string {
  if (height == null || width == null) return '';
  return `${height.toFixed(2)} x ${width.toFixed(2)}`;
}
