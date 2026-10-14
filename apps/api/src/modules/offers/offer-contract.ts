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
  /** "City, Department" shown after the address; blank when it is the location. */
  area: string;
  /** Pre-formatted "alto x ancho", blank when either side is unknown. */
  dimensions: string;
  /** Monthly rent of the line, IVA included. */
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
  /** Sum of the lines' monthly rent, IVA included. */
  monthlyRentalTotal: number;
  /** Rent for the whole period before IVA, as on the offer. */
  contractSubtotal: number;
  contractIva: number;
  /** Rent for the whole period with IVA, matching the offer's rental total. */
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const RENTAL_PERIOD_DAYS = 30;

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * 30-day rental periods in a date range, counted the way the offer builder
 * prices static billboards, so a line's rent splits back into the monthly rate
 * the client was quoted.
 */
export function rentalPeriods(start: Date | null, end: Date | null): number {
  if (!start || !end) return 1;
  const startDay = utcDay(start);
  const endDay = utcDay(end);
  if (endDay < startDay) return 1;
  const inclusiveDays = Math.round((endDay - startDay) / MS_PER_DAY) + 1;
  return Math.max(1, Math.ceil(inclusiveDays / RENTAL_PERIOD_DAYS));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface ContractAmountLine {
  /** Rent for the line's whole period, per unit, before IVA. */
  rentalPrice: number;
  quantity: number;
  taxRate: number;
  startDate: Date | null;
  endDate: Date | null;
}

export interface ContractAmounts {
  /** Monthly rent per line with IVA, in input order. */
  lineMonthlyCosts: number[];
  monthlyRentalTotal: number;
  contractSubtotal: number;
  contractIva: number;
  contractTotal: number;
}

/**
 * Totals are rounded the same way as the offer's rental column (subtotal and
 * IVA each rounded, then added) so the signed figure equals the quoted one.
 */
export function computeContractAmounts(
  lines: ContractAmountLine[],
): ContractAmounts {
  let subtotal = 0;
  let iva = 0;
  let monthly = 0;
  const lineMonthlyCosts: number[] = [];

  for (const line of lines) {
    const lineRental = line.rentalPrice * line.quantity;
    const lineMonthly =
      (lineRental / rentalPeriods(line.startDate, line.endDate)) *
      (1 + line.taxRate);
    subtotal += lineRental;
    iva += lineRental * line.taxRate;
    monthly += lineMonthly;
    lineMonthlyCosts.push(round2(lineMonthly));
  }

  const contractSubtotal = round2(subtotal);
  const contractIva = round2(iva);

  return {
    lineMonthlyCosts,
    monthlyRentalTotal: round2(monthly),
    contractSubtotal,
    contractIva,
    contractTotal: round2(contractSubtotal + contractIva),
  };
}

export function formatDimensions(
  height: number | null,
  width: number | null,
): string {
  if (height == null || width == null) return '';
  return `${height.toFixed(2)} x ${width.toFixed(2)}`;
}
