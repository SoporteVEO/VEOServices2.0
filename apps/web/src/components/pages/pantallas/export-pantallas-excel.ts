import type { PantallasBoard, PantallasLog } from "@/api/pantallas/pantallas.types";
import {
  CAMPAIGN_STATUS_LABELS,
  LOG_TYPE_LABELS,
  VERSION_STATUS_LABELS,
} from "./pantallas-const";
import {
  daysUntil,
  fileStamp,
  formatClock,
  formatClock12,
} from "./pantallas-format";
import { campaignStatus, screenStats, versionStatus } from "./pantallas-logic";
import { logDetail } from "./order-report-logic";

type Cell = string | number | null;

function summarySheet(board: PantallasBoard, refIso: string): Cell[][] {
  const rows: Cell[][] = [
    [
      "PANTALLA",
      "ENCIENDE",
      "APAGA",
      "HORAS AL AIRE",
      "CAPACIDAD (SPOTS)",
      "SPOTS AL AIRE",
      "SPOTS LIBRES",
      "% OCUPACIÓN",
      "SUBLISTAS",
      "ACTIVAS",
      "POR VENCER",
      "PAUSADAS",
      "SPOTS EN PAUSA",
      "FINALIZADAS",
      "PROGRAMADAS",
    ],
  ];
  let capacity = 0;
  let used = 0;
  let paused = 0;
  for (const screen of board.screens) {
    const s = screenStats(screen, board.settings, refIso);
    capacity += s.capacity;
    used += s.used;
    paused += s.pausedSpots;
    rows.push([
      screen.name,
      formatClock12(screen.turnOnAt),
      formatClock12(screen.turnOffAt),
      Math.round(s.hours * 100) / 100,
      s.capacity,
      s.used,
      s.free,
      Math.round(s.pct * 10) / 10,
      screen.sublists.length,
      s.byStatus.ACTIVE,
      s.byStatus.EXPIRING,
      s.byStatus.PAUSED,
      s.pausedSpots,
      s.byStatus.FINISHED,
      s.byStatus.SCHEDULED,
    ]);
  }
  rows.push([]);
  rows.push([
    "TOTAL",
    "",
    "",
    "",
    capacity,
    used,
    capacity - used,
    capacity ? Math.round((used / capacity) * 1000) / 10 : 0,
    "",
    "",
    "",
    "",
    paused,
  ]);
  rows.push([]);
  rows.push(["Fecha de referencia", refIso]);
  rows.push(["Spots por hora", board.settings.spotsPerHour]);
  return rows;
}

function detailSheet(board: PantallasBoard, refIso: string): Cell[][] {
  const rows: Cell[][] = [
    [
      "PANTALLA",
      "SUBLISTA",
      "CAP. SUBLISTA",
      "CLIENTE",
      "CAMPAÑA",
      "INICIO",
      "FIN",
      "SPOTS/DÍA",
      "ESTADO",
      "DÍAS RESTANTES",
      "MOTIVO DE PAUSA",
      "NOTAS",
    ],
  ];
  for (const screen of board.screens) {
    for (const sublist of screen.sublists) {
      if (!sublist.campaigns.length) {
        rows.push([screen.name, sublist.name, sublist.capacity, "(libre)", "", "", "", 0, "LIBRE", "", "", ""]);
        continue;
      }
      for (const c of sublist.campaigns) {
        rows.push([
          screen.name,
          sublist.name,
          sublist.capacity,
          c.client,
          c.campaign,
          c.startDate ?? "",
          c.endDate ?? "",
          c.spotsPerDay,
          CAMPAIGN_STATUS_LABELS[campaignStatus(c, refIso)].toUpperCase(),
          daysUntil(refIso, c.endDate) ?? "",
          c.pauseReason ?? "",
          c.notes ?? "",
        ]);
      }
    }
  }
  return rows;
}

function versionsSheet(board: PantallasBoard, refIso: string): Cell[][] {
  const rows: Cell[][] = [
    ["PANTALLA", "SUBLISTA", "CLIENTE", "CAMPAÑA", "VERSIÓN DEL ARTE", "INICIO", "FIN", "ESTADO", "DÍAS RESTANTES"],
  ];
  for (const screen of board.screens) {
    for (const sublist of screen.sublists) {
      for (const c of sublist.campaigns) {
        for (const v of c.versions) {
          rows.push([
            screen.name,
            sublist.name,
            c.client,
            c.campaign,
            v.title,
            v.startDate ?? "",
            v.endDate ?? "",
            VERSION_STATUS_LABELS[versionStatus(v, refIso)].toUpperCase(),
            daysUntil(refIso, v.endDate) ?? "",
          ]);
        }
      }
    }
  }
  return rows;
}

function logsSheet(logs: PantallasLog[]): Cell[][] {
  const rows: Cell[][] = [
    ["FECHA", "HORA", "TIPO", "CLIENTE", "CAMPAÑA", "PANTALLA", "SUBLISTA", "SPOTS", "INICIO", "FIN", "DETALLE"],
  ];
  const sorted = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const log of sorted) {
    const at = new Date(log.createdAt);
    const valid = !Number.isNaN(at.getTime());
    const detail = [logDetail(log), log.orderGroupId ? "parte de una OP" : ""]
      .filter(Boolean)
      .join(" · ");
    rows.push([
      valid ? at.toLocaleDateString("es-SV") : "",
      valid ? formatClock(at) : "",
      LOG_TYPE_LABELS[log.type].toUpperCase(),
      log.client,
      log.campaign ?? "",
      log.screenName,
      log.sublistName ?? "",
      log.spotsPerDay ?? 0,
      log.startDate ?? "",
      log.endDate ?? "",
      detail,
    ]);
  }
  return rows;
}

function screenSheet(board: PantallasBoard, screenIndex: number, refIso: string): Cell[][] {
  const screen = board.screens[screenIndex];
  const rows: Cell[][] = [["SUBLISTA", "CAPACIDAD", "CLIENTE", "CAMPAÑA", "INICIO", "FIN", "SPOTS/DÍA", "ESTADO"]];
  for (const sublist of screen.sublists) {
    if (!sublist.campaigns.length) {
      rows.push([sublist.name, sublist.capacity, "(libre)", "", "", "", 0, "LIBRE"]);
      continue;
    }
    for (const c of sublist.campaigns) {
      rows.push([
        sublist.name,
        sublist.capacity,
        c.client,
        c.campaign,
        c.startDate ?? "",
        c.endDate ?? "",
        c.spotsPerDay,
        CAMPAIGN_STATUS_LABELS[campaignStatus(c, refIso)].toUpperCase(),
      ]);
    }
  }
  return rows;
}

function sheetName(name: string, used: Set<string>) {
  const base = name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || "PANTALLA";
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toUpperCase())) {
    const suffix = ` (${n++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toUpperCase());
  return candidate;
}

export async function exportPantallasExcel(
  board: PantallasBoard,
  logs: PantallasLog[],
  refIso: string,
) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const used = new Set<string>();
  const append = (name: string, rows: Cell[][]) =>
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName(name, used));

  append("RESUMEN", summarySheet(board, refIso));
  append("DETALLE", detailSheet(board, refIso));
  append("VERSIONES", versionsSheet(board, refIso));
  append("BITÁCORA", logsSheet(logs));
  board.screens.forEach((screen, index) => append(screen.name, screenSheet(board, index, refIso)));

  XLSX.writeFile(workbook, `pantallas_${fileStamp(refIso)}.xlsx`);
}
