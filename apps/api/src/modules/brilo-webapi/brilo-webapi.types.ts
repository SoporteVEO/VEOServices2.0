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
 * Body accepted by POST /api/CXC/AbonoFactura (AbonosXFacturaModelExtended).
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
 * Response returned by POST /api/CXC/AbonoFactura (ConsultaAbonosFacturasModel).
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
