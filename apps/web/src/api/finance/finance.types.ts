/**
 * Brilo models served by /finance/*. Field names are Brilo's own (camelCased
 * by the API) so they can be cross-checked against the Brilo WebAPI docs.
 */

export interface FinancePage<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface FinancePageQuery {
  page?: number;
  pageSize?: number;
}

export interface FinanceDateRange {
  from?: string;
  to?: string;
}

/* ------------------------------------------------------------ Contabilidad */

export interface CuentaConta {
  cueId: number;
  cueCodigo: string | null;
  cueNombre: string | null;
  cueCodigoPadre?: string | null;
  tccCodigo?: string | null;
  cueAcreedor?: boolean;
  cueSaldo?: number;
  cueDetalle?: boolean;
  cueActiva?: boolean;
  cueBloqueada?: boolean;
  cueReqCentroCosto?: boolean;
}

export interface CentroCosto {
  cecoId: number;
  cecoCodigo: string | null;
  cecoNombre: string | null;
  cecoCodigoPadre?: string | null;
  cecoActivo?: boolean;
  cecoEsSub?: boolean;
}

export interface TipoPartida {
  tpaId: number;
  tpaCodigo: string | null;
  tpaNombre: string | null;
  tpaDefault?: boolean;
}

export interface Partida {
  mpaId: number;
  mpaNumero: string | null;
  mpaFecha: string | null;
  mpaDescripcion: string | null;
  tpaCodigo?: string | null;
  tpaNombre?: string | null;
  mpaPosteada?: boolean;
  mpaAnulada?: boolean;
  mpaDeSistema?: boolean;
  mpaBloqueada?: boolean;
  puedeModificarDetalle?: boolean;
}

export interface DetallePartida {
  dpaId: number;
  mpaId: number;
  cueCodigo: string | null;
  cueNombre: string | null;
  cecoCodigo?: string | null;
  cecoNombre?: string | null;
  cecoCodigoSub?: string | null;
  dpaDescripcion: string | null;
  dpaDebe: number;
  dpaHaber: number;
  dpaFechaDoc?: string | null;
  dpaNomSujeto?: string | null;
  dpaTipoDoc?: string | null;
  dpaNumDoc?: string | null;
  dpaReferencia?: string | null;
}

export interface PartidaDetail {
  entry: Partida;
  lines: DetallePartida[];
}

export interface EntriesQuery extends FinancePageQuery, FinanceDateRange {
  number?: string;
  typeCode?: string;
}

export interface CatalogQuery extends FinancePageQuery {
  code?: string;
  name?: string;
}

export interface CreateEntryInput {
  date: string;
  description: string;
  typeCode: string;
  number?: string;
}

export interface EntryLineInput {
  accountCode: string;
  description?: string;
  debit: number;
  credit: number;
  documentDate?: string;
  documentType?: string;
  documentNumber?: string;
  subject?: string;
  costCenterCode?: string;
  reference?: string;
}

/* ------------------------------------------------------------------ Bancos */

export interface CuentaBanco {
  bcuId: number;
  bcoId: number;
  bcoCodigo: string | null;
  bcuNumero: string | null;
  cueCodigo?: string | null;
  monCodigo?: string | null;
  sucCodigo?: string | null;
  fdcNombre?: string | null;
  bcuPreferida?: boolean;
  bcuActiva?: boolean;
}

export interface TipoAbonoBanco {
  tabId: number;
  tabCodigo: string | null;
  tabNombre: string | null;
}

export interface TipoCargoBanco {
  tcbId: number;
  tcbCodigo: string | null;
  tcbNombre: string | null;
}

export interface BankCatalogs {
  accounts: CuentaBanco[];
  depositTypes: TipoAbonoBanco[];
  chargeTypes: TipoCargoBanco[];
}

export interface AbonoBanco {
  abnId: number;
  abnNumero: string | null;
  abnMonto: number;
  abnFecha: string | null;
  abnFechaAplicaBanco?: string | null;
  abnMotivo?: string | null;
  abnPosteado?: boolean;
  abnAnulado?: boolean;
  bcuNumero?: string | null;
  tabCodigo?: string | null;
  monCodigo?: string | null;
}

export interface CargoBanco {
  crgId: number;
  crgNumero: string | null;
  crgMonto: number;
  crgFecha: string | null;
  crgFechaAplicaBanco?: string | null;
  crgMotivo?: string | null;
  crgAcreedor?: string | null;
  crgChequeEntregado?: boolean;
  crgPosteado?: boolean;
  crgAnulado?: boolean;
  bcuNumero?: string | null;
  tcbCodigo?: string | null;
  monCodigo?: string | null;
}

export interface BankMovementsQuery extends FinancePageQuery, FinanceDateRange {
  number?: string;
}

export interface BankMovementInput {
  bankAccountNumber: string;
  typeCode: string;
  amount: number;
  number?: string;
  date?: string;
  bankDate?: string;
  reason?: string;
  costCenterCode?: string;
  creditor?: string;
  chequeDelivered?: boolean;
}

/* --------------------------------------------------------------------- CxC */

export interface DetalleCxc {
  mfaNumDoc: string | null;
  mfaFecha: string | null;
  dccFechaVence: string | null;
  saldo: number;
  vndCodigo?: string | null;
}

export interface SaldoCxcCliente {
  cliNumero: string | null;
  nomCliente: string | null;
  saldo: number;
  cliStatus?: string | null;
  detFacturas?: DetalleCxc[] | null;
}

export interface LimiteCredito {
  cliNumero: string | null;
  lmcrcMontoLimite: number;
  cliPlazoCredito: number;
}

export interface AbonoFacturaConsulta {
  cod_Cliente: string | null;
  tipo_Doc_Factura: string | null;
  num_Doc_Factura: string | null;
  fecha_Abono: string | null;
  tipo_Abono: string | null;
  numero_Abono: string | null;
  valor_Abono: number;
  concepto: string | null;
}

export interface ReceivableCatalogs {
  paymentTypes: { tabId: number; tabCodigo: string | null; tabNombre: string | null }[];
  advanceTypes: { tanvId?: number; tanvCodigo: string | null; tanvNombre: string | null }[];
  banks: { bcoId: number; bcoCodigo: string | null; bcoNombre: string | null }[];
}

export interface ClientCodeQuery extends FinancePageQuery {
  clientCode?: string;
}

export interface InvoicePaymentsQuery extends ClientCodeQuery, FinanceDateRange {
  invoiceNumber?: string;
}

interface PaymentBaseInput {
  amount: number;
  paymentTypeCode: string;
  paymentDocNumber?: string;
  bankCode?: string;
  notes?: string;
}

export interface InvoicePaymentInput extends PaymentBaseInput {
  date: string;
  invoiceType: string;
  invoiceNumber: string;
}

export interface ClientPaymentInput extends PaymentBaseInput {
  date: string;
  clientCode: string;
  advanceTypeCode?: string;
}

export interface AdvanceInput extends PaymentBaseInput {
  clientCode: string;
  advanceTypeCode: string;
  saleDocNumber?: string;
}

/* ------------------------------------------------------------- Facturación */

export interface DetalleFactura {
  dfaId: number;
  proCodigo?: string | null;
  dfaDescripcion: string | null;
  dfaCantidad: number;
  dfaPrecio: number;
  dfaPorcentDesc?: number;
  dfaExento?: boolean;
  dfaTotalLinea: number;
  dfaUniNombre?: string | null;
}

export interface Factura {
  mfaId: number;
  mfaGUID?: string | null;
  mfaTipoDoc: string | null;
  mfaNumDoc: string | null;
  mfaFecha: string | null;
  mfaFechaVence?: string | null;
  cliNumero?: string | null;
  mfaNomCliente?: string | null;
  mfaApeCliente?: string | null;
  mfaNITCliente?: string | null;
  mfaDireccionCliente?: string | null;
  vndCodigo?: string | null;
  sucCodigo?: string | null;
  mfaTitulo?: string | null;
  mfaConceptoDoc?: string | null;
  mfaFormaPago?: string | null;
  mfaPlazoCredito?: number | null;
  mfaSumasAfecto?: number | null;
  mfaSumasExento?: number | null;
  mfaPorcentIVA?: number | null;
  mfaGranTotal?: number | null;
  saldoFactura?: number | null;
  fechaUltAbono?: string | null;
  mfaAnulada?: boolean;
  mfaPosteada?: boolean;
  mfaFinalizada?: boolean;
  detFactura?: DetalleFactura[] | null;
}

export interface FacturaDetail {
  invoice: Factura;
  payments: AbonoFacturaConsulta[];
}

export interface InvoicesQuery extends FinancePageQuery, FinanceDateRange {
  number?: string;
  clientCode?: string;
}

export type OrderStatus = "O" | "F" | "P";

export interface OdfListItem {
  mfaId: number;
  mfaNumDoc: string | null;
  mfaTipoDoc: string | null;
  mfaFecha: string | null;
  mfaTitulo?: string | null;
  cliNombre?: string | null;
  vndNombre?: string | null;
  usuNombre?: string | null;
  tespvNombre?: string | null;
  mfaLista?: boolean;
  mfaFinalizada?: boolean;
  mfaPosteada?: boolean;
  mfaAnulada?: boolean;
  mfaEstado?: string | null;
  total: number;
}

export interface OdfCounts {
  abiertas: number;
  finalizadas: number;
  posteadas: number;
  anuladas: number;
}

export interface OrdersPage extends FinancePage<OdfListItem> {
  counts: OdfCounts | null;
  truncated: boolean;
}

export type OrderDocType = "OFS" | "COT";

export interface OrdersQuery extends FinancePageQuery, FinanceDateRange {
  docType?: OrderDocType;
  status?: OrderStatus;
  search?: string;
}

export interface OdfTotales {
  subTotal: number;
  impuesto: number;
  exento: number;
  percepcion: number;
  retencion: number;
  total: number;
}

export interface OdfDetail {
  order: Factura;
  totals: OdfTotales | null;
}

export interface HistoricoEmail {
  envdocId: number;
  envdocFecHoraCreacion: string | null;
  fechaEnviado: string | null;
  eemEmailSubject: string | null;
  eemEmailsTo: string | null;
  eemEmailsCC: string | null;
  eemEmailsCCO: string | null;
  eemErrorUltFallo: string | null;
  estadoEmail: string | null;
}

export interface DestinatarioSugerido {
  tipo: string | null;
  email: string | null;
  tipoEnvioSugerido: string | null;
}

export interface OrderEmails {
  history: HistoricoEmail[];
  suggested: DestinatarioSugerido[];
}

export type EmailSendType = "TO" | "CC" | "CCO";

export interface SendOrderEmailInput {
  recipients: { email: string; sendType: EmailSendType }[];
  includeSeller?: boolean;
  includeMe?: boolean;
}
