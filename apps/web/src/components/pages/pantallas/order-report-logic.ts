import type {
  CampaignDeal,
  PantallasBoard,
  PantallasLog,
  PantallasLogType,
} from "@/api/pantallas/pantallas.types";
import { ALERT_DAYS, DEAL_LABELS, type StatusTone } from "./pantallas-const";
import {
  clientKey,
  daysBetween,
  formatClock,
  localIsoDate,
  parseIso,
  sameText,
  todayIso,
} from "./pantallas-format";
import { allLocations, livingClients, validityDays } from "./pantallas-logic";

export type ReportPreset = "week" | "lastWeek" | "month" | "lastMonth" | "90" | "all";
export type ReportInclude = "all" | "new" | "expiring" | "expired";
export type ValidityState = "CURRENT" | "EXPIRING" | "EXPIRED" | "SCHEDULED" | "UNDATED";

export const REPORT_PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "week", label: "esta semana" },
  { value: "lastWeek", label: "semana pasada" },
  { value: "month", label: "este mes" },
  { value: "lastMonth", label: "mes pasado" },
  { value: "90", label: "últimos 90 días" },
  { value: "all", label: "todo" },
];

export const REPORT_INCLUDE: { value: ReportInclude; label: string; help: string }[] = [
  {
    value: "all",
    label: "todas",
    help: "Los movimientos del periodo y, aparte, todo lo que sigue al aire.",
  },
  { value: "new", label: "solo OP nuevas", help: "Únicamente las OP que entraron dentro del periodo." },
  { value: "expiring", label: "por vencer", help: `Campañas que terminan dentro de ${ALERT_DAYS} días.` },
  { value: "expired", label: "vencidas", help: "Campañas que ya terminaron y siguen en la lista." },
];

const LOG_STATE_LABELS: Partial<Record<PantallasLogType, string>> = {
  NEW: "Nueva",
  RENEWED: "Renovación",
  EXTENDED: "Extensión de fecha",
  SHORTENED: "Fecha recortada",
};

export const VALIDITY_LABELS: Record<ValidityState, string> = {
  CURRENT: "Vigente",
  EXPIRING: "Por vencer",
  EXPIRED: "Vencida",
  SCHEDULED: "Programada",
  UNDATED: "Sin fechas",
};

const VALIDITY_TONE: Record<ValidityState, StatusTone> = {
  CURRENT: "good",
  EXPIRING: "warning",
  EXPIRED: "critical",
  SCHEDULED: "accent",
  UNDATED: "muted",
};

const LOG_TONE: Partial<Record<PantallasLogType, StatusTone>> = {
  NEW: "good",
  RENEWED: "good",
  EXTENDED: "accent",
  SHORTENED: "warning",
};

function mondayOf(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function shift(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function presetRange(preset: ReportPreset): [string | null, string | null] {
  const today = new Date();
  const monday = mondayOf(today);
  switch (preset) {
    case "week":
      return [localIsoDate(monday), localIsoDate(shift(monday, 6))];
    case "lastWeek": {
      const start = shift(monday, -7);
      return [localIsoDate(start), localIsoDate(shift(start, 6))];
    }
    case "month":
      return [
        localIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        localIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      ];
    case "lastMonth":
      return [
        localIsoDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        localIsoDate(new Date(today.getFullYear(), today.getMonth(), 0)),
      ];
    case "90":
      return [localIsoDate(shift(today, -89)), localIsoDate(today)];
    default:
      return [null, null];
  }
}

export function activePreset(from: string | null, to: string | null): ReportPreset | null {
  if (!from && !to) return "all";
  for (const { value } of REPORT_PRESETS) {
    if (value === "all") continue;
    const [a, b] = presetRange(value);
    if (a === from && b === to) return value;
  }
  return null;
}

export interface ClientValidity {
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  state: ValidityState;
  days: number | null;
  screens: number;
  paused: number;
}

export function clientValidity(board: PantallasBoard, client: string): ClientValidity {
  let startDate: string | null = null;
  let endDate: string | null = null;
  let campaign = "";
  let name = client.trim();
  let screens = 0;
  let paused = 0;
  for (const { campaign: c } of allLocations(board)) {
    if (!sameText(c.client, client)) continue;
    screens++;
    if (c.paused) paused++;
    if (c.client.trim()) name = c.client.trim();
    if (!campaign && c.campaign.trim()) campaign = c.campaign.trim();
    if (c.startDate && (!startDate || c.startDate < startDate)) startDate = c.startDate;
    if (c.endDate && (!endDate || c.endDate > endDate)) endDate = c.endDate;
  }
  const today = parseIso(todayIso())!;
  const end = parseIso(endDate);
  const start = parseIso(startDate);
  let state: ValidityState = "UNDATED";
  let days: number | null = null;
  if (end) {
    days = daysBetween(today, end);
    state = days < 0 ? "EXPIRED" : days <= ALERT_DAYS ? "EXPIRING" : "CURRENT";
  }
  if (start && today < start && state !== "EXPIRED") state = "SCHEDULED";
  return { client: name, campaign, startDate, endDate, state, days, screens, paused };
}

export function validityDaysText(validity: ClientValidity, formatDate: (iso: string) => string) {
  if (validity.days === null) return "";
  if (validity.state === "SCHEDULED") {
    return validity.startDate ? `inicia ${formatDate(validity.startDate)}` : "";
  }
  const abs = Math.abs(validity.days);
  if (validity.days < 0) return `venció hace ${abs} día${abs === 1 ? "" : "s"}`;
  if (validity.days === 0) return "termina hoy";
  if (validity.days === 1) return "falta 1 día";
  return `faltan ${validity.days} días`;
}

export interface ClientLocation {
  screen: string;
  sublist: string;
  spotsPerDay: number;
  paused: boolean;
}

export function clientLocations(board: PantallasBoard, client: string): ClientLocation[] {
  return allLocations(board)
    .filter((l) => sameText(l.campaign.client, client))
    .map((l) => ({
      screen: l.screen.name,
      sublist: l.sublist.name,
      spotsPerDay: l.campaign.spotsPerDay,
      paused: l.campaign.paused,
    }));
}

function campaignsOf(board: PantallasBoard, client: string, campaign: string | null) {
  const ofClient = allLocations(board).filter((l) => sameText(l.campaign.client, client));
  if (!campaign) return ofClient;
  const strict = ofClient.filter((l) => sameText(l.campaign.campaign, campaign));
  return strict.length ? strict : ofClient;
}

export interface DealSummary {
  state: "empty" | "commercial" | "all" | "mixed";
  deal?: CampaignDeal;
  types: CampaignDeal[];
  screensByDeal: Map<CampaignDeal, string[]>;
  totalScreens: number;
}

export function dealSummary(
  board: PantallasBoard,
  client: string,
  campaign: string | null,
): DealSummary {
  const byScreen = new Map<string, { screen: string; deal: CampaignDeal }>();
  for (const l of campaignsOf(board, client, campaign)) {
    const current = byScreen.get(l.screen.id);
    if (!current || current.deal === "COMMERCIAL") {
      byScreen.set(l.screen.id, { screen: l.screen.name, deal: l.campaign.deal });
    }
  }
  const rows = [...byScreen.values()];
  const screensByDeal = new Map<CampaignDeal, string[]>();
  for (const row of rows) {
    if (row.deal === "COMMERCIAL") continue;
    screensByDeal.set(row.deal, [...(screensByDeal.get(row.deal) ?? []), row.screen]);
  }
  const types = [...screensByDeal.keys()];
  const withDeal = [...screensByDeal.values()].reduce((sum, s) => sum + s.length, 0);
  if (!rows.length) return { state: "empty", types, screensByDeal, totalScreens: 0 };
  if (!withDeal) return { state: "commercial", types, screensByDeal, totalScreens: rows.length };
  if (withDeal === rows.length && types.length === 1) {
    return { state: "all", deal: types[0], types, screensByDeal, totalScreens: rows.length };
  }
  return { state: "mixed", types, screensByDeal, totalScreens: rows.length };
}

export function dealText(summary: DealSummary): string {
  if (summary.state === "empty" || summary.state === "commercial") return "";
  if (summary.state === "all" && summary.deal) return DEAL_LABELS[summary.deal];
  return summary.types
    .map((deal) => `${DEAL_LABELS[deal]}: ${(summary.screensByDeal.get(deal) ?? []).join(", ")}`)
    .join(" · ");
}

export interface ClientValues {
  rows: { screen: string; monthly: number | null; spot: number | null; spotsPerDay: number }[];
  total: number | null;
  sum: number | null;
  override: number | null;
  missing: number;
  monthlyMin: number | null;
  monthlyMax: number | null;
  spotMin: number | null;
  spotMax: number | null;
}

export function clientValues(
  board: PantallasBoard,
  client: string,
  campaign: string | null,
): ClientValues {
  const byScreen = new Map<string, ClientValues["rows"][number]>();
  let override: number | null = null;
  for (const l of campaignsOf(board, client, campaign)) {
    const c = l.campaign;
    if (override === null && c.totalValue !== null) override = c.totalValue;
    const row = byScreen.get(l.screen.id) ?? {
      screen: l.screen.name,
      monthly: null,
      spot: null,
      spotsPerDay: 0,
    };
    if (c.monthlyValue !== null) row.monthly = (row.monthly ?? 0) + c.monthlyValue;
    if (c.spotValue !== null && row.spot === null) row.spot = c.spotValue;
    row.spotsPerDay += c.spotsPerDay;
    byScreen.set(l.screen.id, row);
  }
  const rows = [...byScreen.values()];
  const monthly = rows.map((r) => r.monthly).filter((v): v is number => v !== null);
  const spots = rows.map((r) => r.spot).filter((v): v is number => v !== null);
  const sum = monthly.length ? monthly.reduce((a, b) => a + b, 0) : null;
  return {
    rows,
    total: override ?? sum,
    sum,
    override,
    missing: rows.length - monthly.length,
    monthlyMin: monthly.length ? Math.min(...monthly) : null,
    monthlyMax: monthly.length ? Math.max(...monthly) : null,
    spotMin: spots.length ? Math.min(...spots) : null,
    spotMax: spots.length ? Math.max(...spots) : null,
  };
}

export function currentCampaignName(
  board: PantallasBoard,
  client: string,
  campaign: string | null,
) {
  if (campaign) return campaign;
  const found = allLocations(board).find(
    (l) => sameText(l.campaign.client, client) && l.campaign.campaign.trim(),
  );
  return found?.campaign.campaign ?? "";
}

export interface ReportRow {
  key: string;
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string | null;
  log: PantallasLog | null;
  validity: ClientValidity;
  movedLabel?: string;
}

export interface ReportBlock {
  key: "movements" | "onAir";
  title: string;
  rows: ReportRow[];
}

export function logStateLabel(log: PantallasLog) {
  if (log.type === "NEW" && log.orderGroupId) return "Nueva OP";
  return LOG_STATE_LABELS[log.type] ?? log.type;
}

export function rowStateLabel(row: ReportRow) {
  return row.log ? logStateLabel(row.log) : VALIDITY_LABELS[row.validity.state];
}

export function rowStateTone(row: ReportRow): StatusTone {
  if (!row.log) return VALIDITY_TONE[row.validity.state];
  if (row.log.type === "NEW" && row.log.orderGroupId) return "accent";
  return LOG_TONE[row.log.type] ?? "muted";
}

function periodRows(
  logs: PantallasLog[],
  board: PantallasBoard,
  from: string | null,
  to: string | null,
): ReportRow[] {
  const start = parseIso(from);
  const endDay = parseIso(to);
  const end = endDay
    ? new Date(endDay.getFullYear(), endDay.getMonth(), endDay.getDate(), 23, 59, 59, 999)
    : null;
  const living = livingClients(board);
  const latest = new Map<string, PantallasLog>();
  for (const log of logs) {
    const key = clientKey(log.client);
    if (!key || !living.has(key)) continue;
    const at = new Date(log.createdAt);
    if (Number.isNaN(at.getTime())) continue;
    if (start && at < start) continue;
    if (end && at > end) continue;
    const previous = latest.get(key);
    if (!previous || log.createdAt > previous.createdAt) latest.set(key, log);
  }
  return [...latest.entries()]
    .sort((a, b) => b[1].createdAt.localeCompare(a[1].createdAt))
    .map(([key, log]) => ({
      key,
      client: log.client,
      campaign: log.campaign ?? "",
      startDate: log.startDate,
      endDate: log.endDate,
      createdAt: log.createdAt,
      log,
      validity: clientValidity(board, log.client),
    }));
}

function lastLogOf(logs: PantallasLog[], client: string) {
  let out: PantallasLog | null = null;
  for (const log of logs) {
    if (!sameText(log.client, client)) continue;
    if (!out || log.createdAt > out.createdAt) out = log;
  }
  return out;
}

function onAirRows(board: PantallasBoard, logs: PantallasLog[], exclude: Set<string>) {
  const rows: ReportRow[] = [];
  for (const key of livingClients(board)) {
    if (exclude.has(key)) continue;
    const validity = clientValidity(board, key);
    const last = lastLogOf(logs, key);
    rows.push({
      key,
      client: validity.client,
      campaign: validity.campaign || last?.campaign || "",
      startDate: validity.startDate,
      endDate: validity.endDate,
      createdAt: last?.createdAt ?? null,
      log: null,
      validity,
    });
  }
  return rows.sort((a, b) => (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999"));
}

export function reportBlocks(
  logs: PantallasLog[],
  board: PantallasBoard,
  from: string | null,
  to: string | null,
  include: ReportInclude,
): ReportBlock[] {
  const movements = periodRows(logs, board, from, to);
  if (include === "new") {
    return [
      {
        key: "movements",
        title: "OP nuevas del periodo",
        rows: movements.filter((r) => r.log?.type === "NEW"),
      },
    ];
  }
  if (include === "expiring" || include === "expired") {
    const wanted: ValidityState = include === "expiring" ? "EXPIRING" : "EXPIRED";
    const rows = onAirRows(board, logs, new Set())
      .filter((r) => r.validity.state === wanted)
      .map((r) => {
        const moved = movements.find((m) => sameText(m.client, r.client));
        return moved
          ? { ...moved, validity: r.validity, movedLabel: rowStateLabel(moved) }
          : r;
      });
    return [
      {
        key: "onAir",
        title:
          include === "expiring"
            ? `Campañas por vencer · terminan dentro de ${ALERT_DAYS} días`
            : "Campañas vencidas que siguen en la lista",
        rows,
      },
    ];
  }
  return [
    { key: "movements", title: "Movimientos del periodo", rows: movements },
    {
      key: "onAir",
      title: "Campañas al aire sin movimiento en el periodo",
      rows: onAirRows(board, logs, new Set(movements.map((m) => m.key))),
    },
  ];
}

export function onAirCounts(board: PantallasBoard) {
  const counts: Record<ValidityState, number> = {
    CURRENT: 0,
    EXPIRING: 0,
    EXPIRED: 0,
    SCHEDULED: 0,
    UNDATED: 0,
  };
  for (const key of livingClients(board)) counts[clientValidity(board, key).state]++;
  return counts;
}

export function rowDetail(row: ReportRow) {
  return row.log ? logDetail(row.log) : "";
}

export function logDetail(log: PantallasLog) {
  return [
    log.previousEndDate && log.previousEndDate !== log.endDate
      ? `antes terminaba ${log.previousEndDate}`
      : "",
    log.previousSpotsPerDay !== null && log.previousSpotsPerDay !== log.spotsPerDay
      ? `antes ${log.previousSpotsPerDay} spots`
      : "",
    log.detail ?? "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function spotsOverValidity(
  locations: ClientLocation[],
  startDate: string | null,
  endDate: string | null,
) {
  const days = validityDays(startDate, endDate);
  if (days === null) return null;
  return locations.reduce((sum, l) => sum + l.spotsPerDay * days, 0);
}

export interface ReportRowView {
  date: string;
  time: string;
  campaign: string;
  deal: string;
  daysText: string;
  state: string;
  tone: StatusTone;
  movedLabel: string;
  previous: string;
  locations: ClientLocation[];
  values: ClientValues;
}

export function describeReportRow(
  row: ReportRow,
  board: PantallasBoard,
  formatDate: (iso: string | null) => string,
): ReportRowView {
  const at = row.createdAt ? new Date(row.createdAt) : null;
  const valid = at !== null && !Number.isNaN(at.getTime());
  const log = row.log;
  let previous = "";
  if (log && ["RENEWED", "EXTENDED", "SHORTENED"].includes(log.type) && log.previousEndDate) {
    previous = `antes ${formatDate(log.previousEndDate)}`;
  }
  return {
    date: valid
      ? `${String(at.getDate()).padStart(2, "0")}/${String(at.getMonth() + 1).padStart(2, "0")}/${String(at.getFullYear()).slice(2)}`
      : "",
    time: valid ? formatClock(at) : "",
    campaign: currentCampaignName(board, row.client, row.campaign),
    deal: dealText(dealSummary(board, row.client, row.campaign)),
    daysText: validityDaysText(row.validity, (iso) => formatDate(iso)),
    state: rowStateLabel(row),
    tone: rowStateTone(row),
    movedLabel: row.movedLabel ? `${row.movedLabel} en el periodo` : "",
    previous,
    locations: clientLocations(board, row.client),
    values: clientValues(board, row.client, row.campaign),
  };
}

const CSV_HEADER = [
  "BLOQUE",
  "FECHA DE INGRESO",
  "HORA",
  "CLIENTE",
  "CAMPAÑA",
  "INICIO",
  "FIN",
  "ESTADO",
  "DÍAS PARA VENCER",
  "PANTALLAS Y FRECUENCIA",
  "SPOTS POR DÍA",
  "DÍAS DE VIGENCIA",
  "SPOTS DE TODA LA VIGENCIA",
  "VALOR MENSUAL POR PANTALLA",
  "VALOR TOTAL",
  "VALOR POR SPOT POR PANTALLA",
  "MODALIDAD POR PANTALLA",
  "DETALLE",
];

export function buildReportCsv(blocks: ReportBlock[], board: PantallasBoard): string {
  const rows: (string | number)[][] = [CSV_HEADER];
  for (const block of blocks) {
    for (const row of block.rows) {
      const at = row.createdAt ? new Date(row.createdAt) : null;
      const valid = at && !Number.isNaN(at.getTime());
      const locations = clientLocations(board, row.client);
      const values = clientValues(board, row.client, row.campaign);
      rows.push([
        block.title,
        valid ? at.toLocaleDateString("es-SV") : "",
        valid ? formatClock(at) : "",
        row.client,
        row.campaign,
        row.startDate ?? "",
        row.endDate ?? "",
        rowStateLabel(row),
        row.validity.days ?? "",
        locations
          .map((l) => `${l.screen} ${l.spotsPerDay}${l.paused ? " (pausa)" : ""}`)
          .join(" · "),
        locations.reduce((sum, l) => sum + l.spotsPerDay, 0),
        validityDays(row.startDate, row.endDate) ?? "",
        spotsOverValidity(locations, row.startDate, row.endDate) ?? "",
        values.rows
          .map((v) => `${v.screen} ${v.monthly === null ? "sin valor" : v.monthly}`)
          .join(" · "),
        values.total ?? "",
        values.rows.map((v) => `${v.screen} ${v.spot === null ? "sin valor" : v.spot}`).join(" · "),
        dealText(dealSummary(board, row.client, row.campaign)),
        rowDetail(row),
      ]);
    }
  }
  return (
    "\uFEFF" +
    rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
      .join("\r\n")
  );
}
