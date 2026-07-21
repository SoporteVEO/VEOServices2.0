import type { WorkBook, WorkSheet } from "xlsx";

/**
 * Header label for the column with the amount we send to Brilo as
 * `ValorAbonoPropio`. Keep this in sync with the source spreadsheet.
 */
export const AMOUNT_HEADER = "$ RECUPERADO";

/**
 * Required headers expected in every supported sheet (one row will be
 * generated per data row beneath these). Sheets missing these headers are
 * ignored — older sheets in the workbook use a different layout.
 */
const REQUIRED_HEADERS = [
  "CLIENTE",
  "TIPO DE FACT.",
  "DTE",
  "NUMERO DE FACTURA",
  "FECHA RECUP.",
  "# CHEQUE",
  "BANCO CHEQUE",
  "$ RECUPERADO",
] as const;

type RequiredHeader = (typeof REQUIRED_HEADERS)[number];

export interface ParsedRecuperacionRow {
  rowKey: string;
  sheetName: string;
  excelRow: number;
  cliente: string;
  tipoFactura: string;
  dte: string;
  numFactura: string;
  fechaRecuperacion: Date | null;
  numCheque: string;
  bancoExcel: string;
  montoRecuperado: number;
  observaciones: string | null;
  categoria: string | null;
}

export interface ParsedRecuperacionSheet {
  sheetName: string;
  rows: ParsedRecuperacionRow[];
  totalAmount: number;
}

export interface ParsedRecuperacionWorkbook {
  sheets: ParsedRecuperacionSheet[];
  unsupportedSheetNames: string[];
}

interface HeaderMap {
  cliente: number;
  tipoFactura: number;
  dte: number;
  numFactura: number;
  fechaRecuperacion: number;
  numCheque: number;
  bancoExcel: number;
  montoRecuperado: number;
  observaciones: number | null;
  categoria: number | null;
}

function findHeaderRow(
  sheet: WorkSheet,
  XLSX: typeof import("xlsx"),
): { rowIndex: number; values: unknown[] } | null {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i] ?? [];
    const hasCliente = row.some(
      (cell) => typeof cell === "string" && cell.trim() === "CLIENTE",
    );
    if (hasCliente) return { rowIndex: i, values: row };
  }
  return null;
}

function mapHeaders(headerValues: unknown[]): HeaderMap | null {
  const labelToIndex = new Map<string, number>();
  headerValues.forEach((cell, idx) => {
    if (typeof cell === "string") {
      const key = cell.trim().toUpperCase();
      if (key && !labelToIndex.has(key)) labelToIndex.set(key, idx);
    }
  });

  for (const required of REQUIRED_HEADERS) {
    if (!labelToIndex.has(required)) return null;
  }

  const get = (label: RequiredHeader) => labelToIndex.get(label)!;
  const optional = (label: string) =>
    labelToIndex.has(label) ? (labelToIndex.get(label) ?? null) : null;

  return {
    cliente: get("CLIENTE"),
    tipoFactura: get("TIPO DE FACT."),
    dte: get("DTE"),
    numFactura: get("NUMERO DE FACTURA"),
    fechaRecuperacion: get("FECHA RECUP."),
    numCheque: get("# CHEQUE"),
    bancoExcel: get("BANCO CHEQUE"),
    montoRecuperado: get("$ RECUPERADO"),
    observaciones: optional("OBSERVACIONES"),
    categoria: optional("CATEGORIA RECUPERAC"),
  };
}

function pickString(row: unknown[], idx: number): string {
  const raw = row[idx];
  if (raw == null) return "";
  if (raw instanceof Date) return raw.toISOString();
  return String(raw).trim();
}

function pickStringOrNull(row: unknown[], idx: number | null): string | null {
  if (idx == null) return null;
  const value = pickString(row, idx);
  return value || null;
}

function pickNumber(row: unknown[], idx: number): number {
  const raw = row[idx];
  if (raw == null || raw === "") return 0;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const parsed = Number(String(raw).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickDate(row: unknown[], idx: number): Date | null {
  const raw = row[idx];
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  if (typeof raw === "number") {
    const parsed = excelSerialToDate(raw);
    return parsed;
  }
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Excel stores dates as serial numbers (days since 1899-12-30). Translate
 * those to a JS `Date` in the local timezone so the calendar day matches what
 * the user sees in the spreadsheet.
 */
function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial)) return null;
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(utcMs);
}

function parseSheet(
  workbook: WorkBook,
  sheetName: string,
  XLSX: typeof import("xlsx"),
): ParsedRecuperacionSheet | null {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  const header = findHeaderRow(sheet, XLSX);
  if (!header) return null;
  const map = mapHeaders(header.values);
  if (!map) return null;

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  const parsedRows: ParsedRecuperacionRow[] = [];
  let totalAmount = 0;

  for (let i = header.rowIndex + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const cliente = pickString(row, map.cliente);
    if (!cliente) continue;
    const numFactura = pickString(row, map.numFactura);
    if (!numFactura) continue;

    const montoRecuperado = pickNumber(row, map.montoRecuperado);
    const parsed: ParsedRecuperacionRow = {
      rowKey: `${sheetName}::${i + 1}`,
      sheetName,
      excelRow: i + 1,
      cliente,
      tipoFactura: pickString(row, map.tipoFactura),
      dte: pickString(row, map.dte),
      numFactura,
      fechaRecuperacion: pickDate(row, map.fechaRecuperacion),
      numCheque: pickString(row, map.numCheque),
      bancoExcel: pickString(row, map.bancoExcel),
      montoRecuperado,
      observaciones: pickStringOrNull(row, map.observaciones),
      categoria: pickStringOrNull(row, map.categoria),
    };
    parsedRows.push(parsed);
    totalAmount += montoRecuperado;
  }

  return { sheetName, rows: parsedRows, totalAmount };
}

export async function parseRecuperacionesFile(
  file: File,
): Promise<ParsedRecuperacionWorkbook> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });

  const sheets: ParsedRecuperacionSheet[] = [];
  const unsupportedSheetNames: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const parsed = parseSheet(workbook, sheetName, XLSX);
    if (parsed) {
      sheets.push(parsed);
    } else {
      unsupportedSheetNames.push(sheetName);
    }
  }

  return { sheets, unsupportedSheetNames };
}
