export interface BriloBanco {
  bcoId: number;
  bcoCodigo: string;
  bcoNombre: string;
  bcoNombreAbr: string;
}

export interface BriloTipoAbono {
  tabId: number;
  tabCodigo: string;
  tabNombre: string;
}

export interface BriloCatalogos {
  bancos: BriloBanco[];
  tiposAbono: BriloTipoAbono[];
}

export interface RecuperacionRowPayload {
  rowKey: string;
  fechaAbono: string;
  monto: number;
  tipoAbono: string;
  tipoFactura: string;
  numFactura: string;
  bancoCodigo?: string | null;
  numDocAbono?: string | null;
  observaciones?: string | null;
}

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

export interface RecuperacionRowResult {
  rowKey: string;
  ok: boolean;
  error?: string;
  response?: BriloAbonoFacturaResponse;
}

export interface ProcessRecuperacionesResult {
  total: number;
  successCount: number;
  errorCount: number;
  results: RecuperacionRowResult[];
}
