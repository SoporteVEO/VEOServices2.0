import type {
  BriloBanco,
  BriloTipoAbono,
} from "@/api/brilo-webapi/brilo-webapi.types";
import type { ParsedRecuperacionRow } from "./parse-recuperaciones-excel";
import { inferBancoCodigo, inferTipoAbono } from "./infer-mappings";
import type {
  BuildPayloadResult,
  RecuperacionRowState,
} from "./recuperaciones-types";

export function buildInitialRowState(
  parsed: ParsedRecuperacionRow,
  bancos: BriloBanco[],
  tiposAbono: BriloTipoAbono[],
): RecuperacionRowState {
  const monto = roundMoney(parsed.montoRecuperado);
  const bancoCodigo = inferBancoCodigo(parsed.bancoExcel, bancos) ?? "";
  const tipoAbono = inferTipoAbono(parsed.numCheque, parsed.bancoExcel, tiposAbono);
  const includeInUpload = monto > 0;

  return {
    parsed,
    includeInUpload,
    fechaAbono: parsed.fechaRecuperacion
      ? toISODate(parsed.fechaRecuperacion)
      : "",
    monto,
    tipoAbono,
    tipoFactura: parsed.tipoFactura,
    numFactura: parsed.numFactura,
    bancoCodigo,
    numDocAbono: cleanNumDoc(parsed.numCheque),
    observaciones: parsed.observaciones ?? "",
    status: includeInUpload ? "pending" : "skipped",
  };
}

function cleanNumDoc(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  // Drop labels that are not document numbers (UI-only states like
  // "REMESADO" / "CONFIRMADO" / "NC.X") to avoid sending nonsense to Brilo.
  const upper = trimmed.toUpperCase();
  if (
    upper === "REMESADO" ||
    upper === "CONFIRMADO" ||
    upper === "DONACION" ||
    upper === "PAYWAY"
  ) {
    return "";
  }
  return trimmed;
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildRowPayload(
  state: RecuperacionRowState,
): BuildPayloadResult {
  const errors: string[] = [];
  if (!state.includeInUpload) {
    errors.push("La fila está marcada para omitir.");
  }
  if (!state.fechaAbono) errors.push("Falta la fecha del abono.");
  if (!Number.isFinite(state.monto) || state.monto <= 0) {
    errors.push("El monto debe ser mayor a 0.");
  }
  if (!state.tipoAbono?.trim()) errors.push("Falta el tipo de abono.");
  if (!state.tipoFactura?.trim()) errors.push("Falta el tipo de factura.");
  if (!state.numFactura?.trim()) errors.push("Falta el número de factura.");

  const payload = {
    rowKey: state.parsed.rowKey,
    fechaAbono: state.fechaAbono,
    monto: roundMoney(state.monto),
    tipoAbono: state.tipoAbono.trim(),
    tipoFactura: state.tipoFactura.trim(),
    numFactura: state.numFactura.trim(),
    bancoCodigo: state.bancoCodigo.trim() || null,
    numDocAbono: state.numDocAbono.trim() || null,
    observaciones: state.observaciones.trim() || null,
  };

  return errors.length
    ? { payload, validationError: errors.join(" ") }
    : { payload };
}
