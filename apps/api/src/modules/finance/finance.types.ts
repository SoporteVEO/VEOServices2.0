/**
 * Brilo WebAPI models consumed by the finance modules. Only the fields the
 * dashboard reads are listed; Brilo hides fields per token configuration, so
 * everything beyond the identifiers is optional.
 */

/* ------------------------------------------------------------ Contabilidad */

/** CuentasContaExtendedModel — GET /v2/Conta/CuentasConta */
export interface BriloCuentaConta {
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
  cueSoloDeSistema?: boolean;
  cueReqCentroCosto?: boolean;
  cueReqSubCentroCosto?: boolean;
}

/** CentrosCostoExtendedModel — GET /v2/Conta/CentrosCosto */
export interface BriloCentroCosto {
  cecoId: number;
  cecoCodigo: string | null;
  cecoNombre: string | null;
  cecoCodigoPadre?: string | null;
  cecoActivo?: boolean;
  cecoEsSub?: boolean;
}

/** TipoPartidaModel — GET /v2/Conta/TiposPartida */
export interface BriloTipoPartida {
  tpaId: number;
  tpaCodigo: string | null;
  tpaNombre: string | null;
  tpaDefault?: boolean;
  tpaActiva?: boolean;
}

/** PartidaExtendedModel — GET /v2/Conta/Partidas, /v2/Conta/Partida/{mpaId} */
export interface BriloPartida {
  mpaId: number;
  mpaNumero: string | null;
  mpaFecha: string | null;
  mpaDescripcion: string | null;
  tpaId?: number;
  tpaCodigo?: string | null;
  tpaNombre?: string | null;
  mpaPosteada?: boolean;
  mpaAnulada?: boolean;
  mpaDeSistema?: boolean;
  mpaBloqueada?: boolean;
  mpaPreliminar?: boolean;
  puedeModificarDetalle?: boolean;
  mpaFechaHoraCreado?: string | null;
  mpaFechaHoraPosteo?: string | null;
}

/** DetPartidasExtendedModel — GET /v2/Conta/Partida/{mpaId}/Detalles */
export interface BriloDetallePartida {
  dpaId: number;
  mpaId: number;
  cueId?: number;
  cueCodigo: string | null;
  cueNombre: string | null;
  cecoCodigo?: string | null;
  cecoNombre?: string | null;
  cecoCodigoSub?: string | null;
  cecoNombreSub?: string | null;
  dpaDescripcion: string | null;
  dpaDebe: number;
  dpaHaber: number;
  dpaFechaDoc?: string | null;
  dpaNomSujeto?: string | null;
  dpaTipoDoc?: string | null;
  dpaNumDoc?: string | null;
  dpaReferencia?: string | null;
  dpaInsertManual?: boolean;
}

/** DetallePartidaUpsertRequest */
export interface BriloDetallePartidaInput {
  cueCodigo: string;
  dpaDescripcion?: string;
  dpaDebe: number;
  dpaHaber: number;
  dpaFechaDoc?: string;
  dpaNomSujeto?: string;
  dpaTipoDoc?: string;
  dpaNumDoc?: string;
  cecoCodigo?: string;
  cecoCodigoSub?: string;
  dpaReferencia?: string;
}

/* ------------------------------------------------------------------ Bancos */

/** CuentasBancoExtendedModel — GET /v2/Comun/GetCuentasBco */
export interface BriloCuentaBanco {
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

/** TiposAbonoBancoExtendedModel — GET /Bancos/GetTiposAbonoBco */
export interface BriloTipoAbonoBanco {
  tabId: number;
  tabCodigo: string | null;
  tabNombre: string | null;
  cueCodigo?: string | null;
}

/** TiposCargoBancoExtendedModel — GET /Bancos/GetTiposCargoBco */
export interface BriloTipoCargoBanco {
  tcbId: number;
  tcbCodigo: string | null;
  tcbNombre: string | null;
  cueCodigo?: string | null;
}

/** AbonosExtendedModel — GET /Bancos/GetAbonosBco */
export interface BriloAbonoBanco {
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
  cecoCodigo?: string | null;
  mpaId?: number | null;
}

/** CargosExtendedModel — GET /Bancos/GetCargosBco */
export interface BriloCargoBanco {
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
  cecoCodigo?: string | null;
  prvCodigo?: string | null;
  mpaId?: number | null;
}

/* --------------------------------------------------------------------- CxC */

/** DetCXCClienteModel */
export interface BriloDetalleCxc {
  mfaNumDoc: string | null;
  mfaFecha: string | null;
  dccFechaVence: string | null;
  saldo: number;
  vndCodigo?: string | null;
}

/** CuentasXCobrarClientesModel — GET /v2/CXC/GetSaldoCuentaXCobrarCliente */
export interface BriloSaldoCxcCliente {
  cliNumero: string | null;
  nomCliente: string | null;
  saldo: number;
  cliStatus?: string | null;
  detFacturas?: BriloDetalleCxc[] | null;
}

/** LimitesCredClientesModel — GET /v2/CXC/LimitesCreditoClientes */
export interface BriloLimiteCredito {
  cliNumero: string | null;
  lmcrcMontoLimite: number;
  cliPlazoCredito: number;
}

/** ConsultaAbonosFacturasModel — GET /v2/CXC/GetAbonosFacturas */
export interface BriloAbonoFacturaConsulta {
  cod_Cliente: string | null;
  tipo_Doc_Factura: string | null;
  num_Doc_Factura: string | null;
  fecha_Abono: string | null;
  tipo_Abono: string | null;
  numero_Abono: string | null;
  valor_Abono: number;
  concepto: string | null;
}

/** TipoAbonoVentaModel — GET /v2/Ventas/TiposAbonoVenta */
export interface BriloTipoAbonoVenta {
  tabId: number;
  tabCodigo: string | null;
  tabNombre: string | null;
}

/** TipoAnticipoVentaModel — GET /v2/Ventas/TiposAnticipoVenta */
export interface BriloTipoAnticipoVenta {
  tanvId?: number;
  tanvCodigo: string | null;
  tanvNombre: string | null;
}

/** BancoAnticipoModel — GET /v2/Ventas/BancosAnticipo */
export interface BriloBancoAnticipo {
  bcoId: number;
  bcoCodigo: string | null;
  bcoNombre: string | null;
}

/* ------------------------------------------------------------- Facturación */

/** DetFacturasExtendedModel (subset) */
export interface BriloDetalleFactura {
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

/** MaeFacturasExtendedModel (subset) — GET /v2/Ventas/Facturas */
export interface BriloFactura {
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
  cecoCodigo?: string | null;
  mfaTitulo?: string | null;
  mfaConceptoDoc?: string | null;
  mfaFormaPago?: string | null;
  mfaPlazoCredito?: number | null;
  mfaSumasAfecto?: number | null;
  mfaSumasExento?: number | null;
  mfaPorcentIVA?: number | null;
  mfaPorcentRet?: number | null;
  mfaPorcentPercep?: number | null;
  mfaGranTotal?: number | null;
  saldoFactura?: number | null;
  fechaUltAbono?: string | null;
  mfaAnulada?: boolean;
  mfaPosteada?: boolean;
  mfaFinalizada?: boolean;
  mfaImpreso?: boolean;
  detFactura?: BriloDetalleFactura[] | null;
}

/** OdfListItemModel — items of GET /v2/Ventas/ODFs */
export interface BriloOdfListItem {
  mfaId: number;
  mfaGUID?: string | null;
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
  mfaGranTotal?: number | null;
  mfaEstado?: string | null;
  total: number;
}

/** OdfConteosModel */
export interface BriloOdfConteos {
  abiertas: number;
  finalizadas: number;
  posteadas: number;
  anuladas: number;
}

/** OdfListadoResultModel — GET /v2/Ventas/ODFs */
export interface BriloOdfListado {
  items?: BriloOdfListItem[] | null;
  total?: number;
  truncado?: boolean;
  conteos?: BriloOdfConteos | null;
}

/** OdfTotalesModel */
export interface BriloOdfTotales {
  subTotal: number;
  impuesto: number;
  exento: number;
  percepcion: number;
  retencion: number;
  total: number;
}

/** OdfDetalleResultModel — GET /v2/Ventas/ODF/{mfaId} */
export interface BriloOdfDetalle {
  documento: BriloFactura | BriloFactura[] | null;
  totales: BriloOdfTotales | null;
}

/** HistoricoEmailModel — GET /v2/Ventas/ODF/{mfaId}/Email/Historico */
export interface BriloHistoricoEmail {
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

/** DestinatarioSugeridoModel */
export interface BriloDestinatarioSugerido {
  tipo: string | null;
  email: string | null;
  tipoEnvioSugerido: string | null;
}

/** EnviarEmailResultModel */
export interface BriloEnviarEmailResult {
  code: string | null;
  message: string | null;
  envdocId: number | null;
  destinatarios: number;
}
