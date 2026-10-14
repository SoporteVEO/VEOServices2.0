import type { Screen } from "@/api/pantallas/pantallas.types";
import { normalizeText } from "./pantallas-format";

const SPANISH_MONTHS: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

const WIN_ANSI: Record<number, string> = {
  128: "€", 130: "‚", 131: "ƒ", 132: "„", 133: "…", 134: "†", 135: "‡", 136: "ˆ",
  137: "‰", 138: "Š", 139: "‹", 140: "Œ", 142: "Ž", 145: "‘", 146: "’", 147: "“",
  148: "”", 149: "•", 150: "–", 151: "—", 152: "˜", 153: "™", 154: "š", 155: "›",
  156: "œ", 158: "ž", 159: "Ÿ",
};

const LABEL_STOP_WORDS = [
  "Fecha de ingreso",
  "Nombre de agencia",
  "Valor por",
  "Costo x spot",
  "Valor Mensual",
  "Valor Total",
];

export interface ParsedOrderScreen {
  screenId: string;
  spotsPerDay: number;
  monthlyValue: number | null;
  spotValue: number | null;
}

export interface ParsedOrder {
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  agency: string;
  executive: string;
  artFormat: string;
  monthlyValue: number | null;
  totalValue: number | null;
  screens: ParsedOrderScreen[];
  warnings: string[];
}

const winChar = (b: number) => (b >= 128 && b <= 159 ? (WIN_ANSI[b] ?? "") : String.fromCharCode(b));

async function inflate(bytes: Uint8Array, format: CompressionFormat): Promise<Uint8Array | null> {
  try {
    const stream = new DecompressionStream(format);
    const writer = stream.writable.getWriter();
    writer.write(bytes as Uint8Array<ArrayBuffer>).catch(() => {});
    writer.close().catch(() => {});
    const reader = stream.readable.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        total += value.length;
      }
    } catch {
      // Trailing bytes after the deflate stream are expected in some PDFs.
    }
    if (!total) return null;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  } catch {
    return null;
  }
}

function toLatin1(bytes: Uint8Array) {
  let out = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return out;
}

function unescapePdf(value: string) {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (c !== "\\") {
      out += c;
      continue;
    }
    const next = value[++i];
    if (next === "n" || next === "r") out += " ";
    else if (next >= "0" && next <= "7") {
      let octal = next;
      while (octal.length < 3 && value[i + 1] >= "0" && value[i + 1] <= "7") octal += value[++i];
      out += winChar(parseInt(octal, 8));
    } else out += next;
  }
  return [...out]
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code < 256 ? winChar(code) : ch;
    })
    .join("");
}

function linesFromContent(content: string) {
  const items: { x: number; y: number; text: string }[] = [];
  let x = 0;
  let y = 0;
  const pattern =
    /(-?[\d.]+)\s+(-?[\d.]+)\s+Td|1\s+0\s+0\s+1\s+(-?[\d.]+)\s+(-?[\d.]+)\s+Tm|\[((?:[^[\]\\]|\\.)*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
  for (const m of content.matchAll(pattern)) {
    if (m[3] !== undefined) {
      x = Number(m[3]);
      y = Number(m[4]);
      continue;
    }
    if (m[1] !== undefined) {
      x += Number(m[1]);
      y += Number(m[2]);
      continue;
    }
    let text = "";
    if (m[5] !== undefined) {
      for (const t of m[5].matchAll(/\(((?:[^()\\]|\\.)*)\)/g)) text += unescapePdf(t[1]);
    } else if (m[6] !== undefined) text = unescapePdf(m[6]);
    if (text) items.push({ x, y, text });
  }
  const rows = new Map<number, typeof items>();
  for (const item of items) {
    const key = Math.round(item.y);
    rows.set(key, [...(rows.get(key) ?? []), item]);
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) =>
      row
        .sort((a, b) => a.x - b.x)
        .map((i) => i.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

async function pdfLines(bytes: Uint8Array) {
  const raw = toLatin1(bytes);
  const out: string[] = [];
  const pattern = /stream\r?\n/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    const start = match.index + match[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) continue;
    pattern.lastIndex = end;
    const chunk = bytes.subarray(start, end);
    const inflated = (await inflate(chunk, "deflate")) ?? (await inflate(chunk, "deflate-raw"));
    if (!inflated) continue;
    const content = toLatin1(inflated);
    if (!/\bTJ\b|\bTj\b/.test(content)) continue;
    out.push(...linesFromContent(content));
  }
  return out;
}

function isoFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function xlsxLines(buffer: ArrayBuffer) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("El Excel no tiene una primera hoja legible.");
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  return rows
    .map((row) =>
      row
        .map((cell) => (cell instanceof Date ? isoFromDate(cell) : String(cell ?? "").trim()))
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean);
}

export function dateFromText(text: string): string | null {
  let m = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = text.match(/(\d{1,2})\s*(?:de\s*)?([A-Za-zÁÉÍÓÚÑáéíóúñ]{4,})\s*(?:de\s*)?(\d{4})/);
  if (m) {
    const month = SPANISH_MONTHS[normalizeText(m[2])];
    if (month) return `${m[3]}-${String(month).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
  }
  m = text.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return `${m[3]}-${String(Number(m[2])).padStart(2, "0")}-${String(Number(m[1])).padStart(2, "0")}`;
  return null;
}

function afterLabel(lines: string[], label: string) {
  const target = normalizeText(label);
  for (let i = 0; i < lines.length; i++) {
    const index = normalizeText(lines[i]).indexOf(target);
    if (index < 0) continue;
    let rest = lines[i].slice(index + label.length).replace(/^[:\s]+/, "");
    rest = rest.split(/\s{2,}(?=[A-ZÁÉÍÓÚ])/)[0];
    for (const other of LABEL_STOP_WORDS) {
      const at = normalizeText(rest).indexOf(normalizeText(other));
      if (at > 0) rest = rest.slice(0, at);
    }
    rest = rest.trim();
    if (rest) return rest;
    if (lines[i + 1] && !lines[i + 1].includes(":")) return lines[i + 1].trim();
  }
  return "";
}

export function parseOrderNumber(value: string | number | null | undefined): number | null {
  let s = String(value ?? "").replace(/[^\d.,-]/g, "");
  if (!s || !/\d/.test(s)) return null;
  const comma = s.lastIndexOf(",");
  const dot = s.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    s = comma > dot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (comma >= 0) {
    s = /,\d{3}$/.test(s) && !/^-?0,/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  const parsed = parseFloat(s);
  return Number.isFinite(parsed) ? parsed : null;
}

function rowValues(tail: string) {
  const tokens = [...tail.matchAll(/(\$\s*)?(-?\d[\d.,]*)/g)].map((m) => ({
    money: Boolean(m[1]),
    raw: m[2],
    value: parseOrderNumber(m[2]),
  }));
  const numbers = tokens.filter((t) => t.value !== null);
  if (!numbers.length) return null;
  const spotsPerDay = Math.round(
    parseFloat(numbers[0].raw.replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".")),
  );
  const money = numbers.filter((t) => t.money);
  if (money.length) {
    return {
      spotsPerDay,
      monthlyValue: money[0]?.value ?? null,
      spotValue: money[1]?.value ?? null,
    };
  }
  return {
    spotsPerDay,
    monthlyValue: numbers[2]?.value ?? null,
    spotValue: numbers[3]?.value ?? null,
  };
}

function screenAliases(screen: Screen) {
  const aliases = [...screen.aliases, screen.name, screen.code]
    .map((a) => normalizeText(a).trim())
    .filter((a) => a.length >= 3);
  return [...new Set(aliases)].sort((a, b) => b.length - a.length);
}

function parseOrder(lines: string[], screens: Screen[]): ParsedOrder {
  const order: ParsedOrder = {
    client: afterLabel(lines, "Marca"),
    campaign: afterLabel(lines, "Campaña"),
    agency: afterLabel(lines, "Nombre de agencia"),
    executive: afterLabel(lines, "Ejecutivo/a") || afterLabel(lines, "Ejecutivo"),
    artFormat: afterLabel(lines, "Formato de Arte"),
    startDate: dateFromText(afterLabel(lines, "Fecha de inicio")),
    endDate: dateFromText(afterLabel(lines, "Fecha de fin") || afterLabel(lines, "Fecha final")),
    monthlyValue: parseOrderNumber(afterLabel(lines, "Valor Mensual")),
    totalValue: parseOrderNumber(afterLabel(lines, "Valor Total")),
    screens: [],
    warnings: [],
  };

  const aliasList = screens.map((screen) => ({ screen, aliases: screenAliases(screen) }));
  const seen = new Set<string>();
  for (const line of lines) {
    const normalized = normalizeText(line);
    if (normalized.includes("seleccione pantalla")) continue;
    for (const { screen, aliases } of aliasList) {
      if (seen.has(screen.id)) continue;
      for (const alias of aliases) {
        const index = normalized.indexOf(alias);
        if (index < 0) continue;
        const values = rowValues(line.slice(index + alias.length));
        const spots = values?.spotsPerDay ?? 0;
        if (values && spots >= 50 && spots <= 20000) {
          order.screens.push({
            screenId: screen.id,
            spotsPerDay: spots,
            monthlyValue: values.monthlyValue,
            spotValue: values.spotValue,
          });
          seen.add(screen.id);
        }
        break;
      }
    }
  }

  if (!order.client) order.warnings.push("no encontré la marca o cliente");
  if (!order.startDate) order.warnings.push("no encontré la fecha de inicio");
  if (!order.endDate) order.warnings.push("no encontré la fecha final");
  if (!order.screens.length) order.warnings.push("no encontré pantallas con spots");
  return order;
}

export async function readOrderFile(file: File, screens: Screen[]): Promise<ParsedOrder> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  let lines: string[];
  if (isPdf) lines = await pdfLines(bytes);
  else if (isZip) lines = await xlsxLines(buffer);
  else if (bytes[0] === 0xd0 && bytes[1] === 0xcf) {
    throw new Error("Es un Excel del formato antiguo (.xls). Ábrelo y guárdalo como .xlsx.");
  } else throw new Error("Formato no reconocido. Usa el PDF o el Excel (.xlsx) de la OP.");
  if (!lines.length) {
    throw new Error(
      "No pude sacar texto del archivo. Si el PDF es un escaneo o una imagen, usa el Excel.",
    );
  }
  return parseOrder(lines, screens);
}
