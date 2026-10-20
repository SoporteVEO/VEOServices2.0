/**
 * Catalog item returned by GET /api/Bancos/GetTiposAbonoBco (TipoAbono used in CXC
 * AbonoFactura calls, e.g. "EFE", "CHE", "TRA").
 */
export interface BriloTipoAbono {
  tabId: number;
  tabCodigo: string;
  tabNombre: string;
}

/**
 * Bank entry available in Brilo (olComun.dbo.Bancos).
 */
export interface BriloBanco {
  bcoId: number;
  bcoCodigo: string;
  bcoNombre: string;
  bcoNombreAbr: string;
}

/**
 * Body accepted by POST /api/v2/CXC/AbonoFactura (AbonosXFacturaModelExtended).
 * Only the fields we actually populate from the recuperaciones flow are listed.
 */
export interface BriloAbonoFacturaInput {
  fechaAbono: string;
  valorAbonoPropio: number;
  tipoAbono: string;
  tipoFactura: string;
  numFactura: string;
  numDocAbono?: string;
  observaciones?: string;
  numAbono?: string;
  bcoCodigo?: string;
  bcoId?: number;
}

/**
 * Response returned by POST /api/v2/CXC/AbonoFactura (ConsultaAbonosFacturasModel).
 */
export interface BriloAbonoFacturaResponse {
  cod_Cliente?: string;
  tipo_Doc_Factura?: string;
  num_Doc_Factura?: string;
  fecha_Abono?: string;
  tipo_Abono?: string;
  numero_Abono?: string;
  valor_Abono?: number;
  concepto?: string;
}

/** Line of POST /api/Vallas/Cotizaciones (DetCotizacionesExtendedModel). */
export interface BriloCotizacionDetalleInput {
  dcotId: number;
  mcotId: number;
  caraId: number;
  dcotCostoArrendamiento: number;
  dcotCostoImpresion: number | null;
  dcotFechaDesde: string | null;
  dcotFechaHasta: string | null;
  dcotAceptada: boolean;
  dcotEsCircuito: boolean;
  dcotConsolidaPorSitio: boolean;
}

/** Body of POST /api/Vallas/Cotizaciones (MaeCotizacionesExtendedModel). */
export interface BriloCotizacionInput {
  mcotId: number;
  cliId: number;
  ejecId: number;
  mcotFechaRegistro: string;
  mcotEstado: number;
  mcotFechaAceptacion: string | null;
  mcotIncAgencia: boolean;
  mcotConsolidarPrecio: boolean;
  mcotObservaciones: string | null;
  mcotAtencionA: string | null;
  detalles: BriloCotizacionDetalleInput[];
}

export interface BriloCotizacionResponse {
  mcotId?: number;
  mcotNumero?: string | null;
}

/** Line of POST /api/Vallas/Contratos (DetContratosExtendedModel). */
export interface BriloContratoDetalleInput {
  dconId: number;
  mconId: number;
  caraId: number;
  dconCostoArrendamiento: number;
  dconCostoImpresion: number | null;
  dconFechaDesde: string | null;
  dconFechaHasta: string | null;
  dconConsolidaPorSitio: boolean;
}

/** Body of POST /api/Vallas/Contratos (MaeContratosExtendedModel). */
export interface BriloContratoInput {
  mconId: number;
  mcotId: number;
  cliId: number;
  ejecId: number;
  mconFecha: string;
  mconFechaInicio: string | null;
  mconFechaFin: string | null;
  mconPosteado: boolean;
  mconAnulado: boolean;
  mconRequiereInstalacion: boolean;
  mconObservaciones: string | null;
  mconAtencionA: string | null;
  mconFrecuenciaCuotas: number;
  mconPeriodicidadCuotas: string;
  mconFecCuotaInicial: string;
  detalles: BriloContratoDetalleInput[];
}

export interface BriloContratoResponse {
  mconId?: number;
  mconCodigo?: string | null;
  mconPosteado?: boolean | null;
}
