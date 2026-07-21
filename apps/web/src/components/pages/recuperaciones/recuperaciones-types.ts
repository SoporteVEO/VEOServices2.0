import type {
  BriloAbonoFacturaResponse,
  RecuperacionRowPayload,
} from "@/api/brilo-webapi/brilo-webapi.types";
import type { ParsedRecuperacionRow } from "./parse-recuperaciones-excel";

export type RecuperacionRowStatus =
  | "pending"
  | "skipped"
  | "submitting"
  | "success"
  | "error";

/**
 * Editable, UI-side representation of a parsed Excel row. We keep the raw
 * parsed data in `parsed` and the user's (possibly edited) values flat at the
 * root so the table cells can bind directly.
 */
export interface RecuperacionRowState {
  parsed: ParsedRecuperacionRow;
  includeInUpload: boolean;
  fechaAbono: string;
  monto: number;
  tipoAbono: string;
  tipoFactura: string;
  numFactura: string;
  bancoCodigo: string;
  numDocAbono: string;
  observaciones: string;
  status: RecuperacionRowStatus;
  errorMessage?: string;
  response?: BriloAbonoFacturaResponse;
}

export interface BuildPayloadResult {
  payload: RecuperacionRowPayload;
  validationError?: string;
}
