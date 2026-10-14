import type {
  Campaign,
  CampaignVersion,
  PantallasBoard,
  PantallasLog,
  PantallasSettings,
  Screen,
  Sublist,
} from "@/api/pantallas/pantallas.types";
import {
  ALERT_DAYS,
  DEFAULT_VALIDITY_DAYS,
  FULL_SUBLIST_SPOTS,
  HALF_SUBLIST_SPOTS,
  MAX_OPERATING_HOURS,
  SUGGESTED_TURN_ON,
  VERSION_STATUS_LABELS,
  type CampaignStatus,
  type VersionStatus,
} from "./pantallas-const";
import {
  clientKey,
  daysBetween,
  formatClock12,
  formatCount,
  formatHours,
  minutesOf,
  normalizeText,
  parseIso,
  sameText,
  toHHMM,
} from "./pantallas-format";

type Dated = { startDate: string | null; endDate: string | null };

export function campaignStatus(
  campaign: Dated & { paused: boolean },
  refIso: string,
): CampaignStatus {
  const ref = parseIso(refIso)!;
  const start = parseIso(campaign.startDate);
  const end = parseIso(campaign.endDate);
  if (end && ref > end) return "FINISHED";
  if (campaign.paused) return "PAUSED";
  if (!campaign.startDate && !campaign.endDate) return "UNDATED";
  if (start && ref < start) return "SCHEDULED";
  if (end && daysBetween(ref, end) <= ALERT_DAYS) return "EXPIRING";
  return "ACTIVE";
}

export function occupiesAir(status: CampaignStatus) {
  return status === "ACTIVE" || status === "EXPIRING";
}

export function versionStatus(version: Dated, refIso: string): VersionStatus {
  const ref = parseIso(refIso)!;
  const start = parseIso(version.startDate);
  const end = parseIso(version.endDate);
  if (!version.startDate && !version.endDate) return "UNDATED";
  if (end && ref > end) return "EXPIRED";
  if (start && ref < start) return "SCHEDULED";
  if (end && daysBetween(ref, end) <= ALERT_DAYS) return "EXPIRING";
  return "CURRENT";
}

export function versionsSummary(versions: CampaignVersion[], refIso: string) {
  if (!versions.length) return null;
  const count: Record<VersionStatus, number> = {
    CURRENT: 0,
    EXPIRING: 0,
    EXPIRED: 0,
    SCHEDULED: 0,
    UNDATED: 0,
  };
  for (const v of versions) count[versionStatus(v, refIso)]++;
  const worst: VersionStatus = count.EXPIRED
    ? "EXPIRED"
    : count.EXPIRING
      ? "EXPIRING"
      : count.CURRENT
        ? "CURRENT"
        : count.SCHEDULED
          ? "SCHEDULED"
          : "UNDATED";
  const detail = (Object.entries(count) as [VersionStatus, number][])
    .filter(([, n]) => n)
    .map(([k, n]) => `${n} ${VERSION_STATUS_LABELS[k].toLowerCase()}`)
    .join(" · ");
  return { total: versions.length, worst, detail };
}

export function operatingHours(turnOnAt: string, turnOffAt: string): number {
  const on = minutesOf(turnOnAt);
  const off = minutesOf(turnOffAt);
  if (on === null || off === null) return 0;
  const diff = (off - on + 1440) % 1440;
  return (diff === 0 ? 1440 : diff) / 60;
}

export function screenHours(screen: Pick<Screen, "turnOnAt" | "turnOffAt">) {
  return operatingHours(screen.turnOnAt, screen.turnOffAt);
}

export function screenCapacity(
  screen: Pick<Screen, "turnOnAt" | "turnOffAt">,
  settings: PantallasSettings,
) {
  return Math.round(screenHours(screen) * settings.spotsPerHour);
}

export interface SublistStats {
  used: number;
  active: number;
  pausedSpots: number;
  pausedCount: number;
  free: number;
  pct: number;
  pausedPct: number;
}

export function sublistStats(sublist: Sublist, refIso: string): SublistStats {
  let used = 0;
  let active = 0;
  let pausedSpots = 0;
  let pausedCount = 0;
  for (const c of sublist.campaigns) {
    const status = campaignStatus(c, refIso);
    if (occupiesAir(status)) {
      used += c.spotsPerDay;
      active++;
    }
    if (status === "PAUSED") {
      pausedSpots += c.spotsPerDay;
      pausedCount++;
    }
  }
  return {
    used,
    active,
    pausedSpots,
    pausedCount,
    free: sublist.capacity - used,
    pct: sublist.capacity ? (used / sublist.capacity) * 100 : 0,
    pausedPct: sublist.capacity ? (pausedSpots / sublist.capacity) * 100 : 0,
  };
}

export interface ScreenStats {
  capacity: number;
  hours: number;
  used: number;
  pausedSpots: number;
  free: number;
  pct: number;
  campaigns: number;
  sublists: number;
  byStatus: Record<CampaignStatus, number>;
}

export function screenStats(
  screen: Screen,
  settings: PantallasSettings,
  refIso: string,
): ScreenStats {
  const byStatus: Record<CampaignStatus, number> = {
    ACTIVE: 0,
    EXPIRING: 0,
    FINISHED: 0,
    SCHEDULED: 0,
    UNDATED: 0,
    PAUSED: 0,
  };
  let used = 0;
  let pausedSpots = 0;
  let campaigns = 0;
  for (const sublist of screen.sublists) {
    for (const c of sublist.campaigns) {
      const status = campaignStatus(c, refIso);
      byStatus[status]++;
      campaigns++;
      if (occupiesAir(status)) used += c.spotsPerDay;
      if (status === "PAUSED") pausedSpots += c.spotsPerDay;
    }
  }
  const capacity = screenCapacity(screen, settings);
  return {
    capacity,
    hours: screenHours(screen),
    used,
    pausedSpots,
    free: capacity - used,
    pct: capacity ? (used / capacity) * 100 : 0,
    campaigns,
    sublists: screen.sublists.length,
    byStatus,
  };
}

export type BarTone = "ok" | "warn" | "over";

export function barTone(pct: number): BarTone {
  return pct > 100.5 ? "over" : pct >= 99.5 ? "warn" : "ok";
}

export type ScheduleSuggestionType = "up" | "down" | "align" | "ok";

export interface ScheduleSuggestion {
  type: ScheduleSuggestionType;
  title: string;
  detail: string;
  turnOnAt?: string;
  turnOffAt?: string;
}

export function scheduleSuggestion(
  screen: Screen,
  stats: ScreenStats,
  settings: PantallasSettings,
): ScheduleSuggestion {
  const sph = settings.spotsPerHour;
  const committed = stats.used + stats.pausedSpots;
  const need = Math.ceil(committed / (sph / 2)) / 2;
  const note = stats.pausedSpots
    ? ` (incluye ${formatCount(stats.pausedSpots)} en pausa)`
    : "";
  const on = SUGGESTED_TURN_ON;
  const onMinutes = minutesOf(on)!;
  const maxSpots = MAX_OPERATING_HOURS * sph;

  if (need > MAX_OPERATING_HOURS) {
    return {
      type: "up",
      turnOnAt: on,
      turnOffAt: toHHMM(onMinutes + MAX_OPERATING_HOURS * 60),
      title: `No alcanza ni operando ${MAX_OPERATING_HOURS} h`,
      detail: `Hay ${formatCount(committed)} spots comprometidos${note} y el tope son ${formatCount(maxSpots)}. Sobran ${formatCount(committed - maxSpots)} spots que habría que mover a otra pantalla.`,
    };
  }

  const hours = Math.min(MAX_OPERATING_HOURS, Math.max(settings.minHours, need));
  const off = toHHMM(onMinutes + Math.round(hours * 60));
  const suggestedCapacity = Math.round(hours * sph);

  if (hours > stats.hours + 0.01) {
    return {
      type: "up",
      turnOnAt: on,
      turnOffAt: off,
      title: `Amplía a ${formatHours(hours)} · ${formatClock12(on)} a ${formatClock12(off)}`,
      detail:
        stats.hours < settings.minHours
          ? `La pantalla está en ${formatHours(stats.hours)} y el mínimo configurado son ${formatHours(settings.minHours)}. Subiría la capacidad a ${formatCount(suggestedCapacity)} spots.`
          : `Tienes ${formatCount(committed)} spots comprometidos${note} y solo caben ${formatCount(stats.capacity)}. Con ${formatHours(hours)} caben ${formatCount(suggestedCapacity)}.`,
    };
  }
  if (hours < stats.hours - 0.01) {
    return {
      type: "down",
      turnOnAt: on,
      turnOffAt: off,
      title: `Puedes bajar a ${formatHours(hours)} · ${formatClock12(on)} a ${formatClock12(off)}`,
      detail: `Con ${formatCount(committed)} spots comprometidos${note} te sobran ${formatCount(stats.capacity - committed)}. La capacidad quedaría en ${formatCount(suggestedCapacity)} spots y apagarías ${formatHours(stats.hours - hours)} antes.`,
    };
  }
  if (screen.turnOnAt !== on) {
    const alignedOff = toHHMM(onMinutes + Math.round(stats.hours * 60));
    return {
      type: "align",
      turnOnAt: on,
      turnOffAt: alignedOff,
      title: `Alinea el encendido a las ${formatClock12(on)}`,
      detail: `Las pantallas suelen encender a esa hora. Manteniendo ${formatHours(stats.hours)} quedaría de ${formatClock12(on)} a ${formatClock12(alignedOff)}.`,
    };
  }
  return {
    type: "ok",
    title: "El horario está bien ajustado",
    detail: `${formatHours(stats.hours)} para ${formatCount(committed)} spots comprometidos${note} · quedan ${formatCount(stats.capacity - committed)} libres.`,
  };
}

export function validityDays(startIso: string | null, endIso: string | null) {
  const start = parseIso(startIso);
  const end = parseIso(endIso);
  if (!start || !end) return null;
  const days = daysBetween(start, end) + 1;
  return days > 0 ? days : null;
}

export function billingDays(startIso: string | null, endIso: string | null) {
  return validityDays(startIso, endIso) ?? DEFAULT_VALIDITY_DAYS;
}

export function exactSpotValue(
  monthlyValue: number | null,
  spotsPerDay: number,
  startIso: string | null,
  endIso: string | null,
) {
  const spots = spotsPerDay * billingDays(startIso, endIso);
  if (monthlyValue === null || spots <= 0) return null;
  return Number((monthlyValue / spots).toFixed(4));
}

export interface PlacementInput {
  client: string;
  campaign: string;
  startDate: string | null;
  endDate: string | null;
  spotsPerDay: number;
}

export type PlacementPlan =
  | { type: "duplicate"; sublist: Sublist }
  | { type: "fit"; sublist: Sublist; remaining: number }
  | { type: "new"; capacity: number; needsMoreHours: boolean; hoursNeeded: number };

export function planPlacement(
  screen: Screen,
  input: PlacementInput,
  settings: PantallasSettings,
  refIso: string,
): PlacementPlan {
  for (const sublist of screen.sublists) {
    const duplicate = sublist.campaigns.some(
      (c) =>
        sameText(c.client, input.client) &&
        sameText(c.campaign, input.campaign) &&
        c.startDate === input.startDate &&
        c.endDate === input.endDate,
    );
    if (duplicate) return { type: "duplicate", sublist };
  }

  let best: { sublist: Sublist; free: number } | null = null;
  for (const sublist of screen.sublists) {
    const free = sublistStats(sublist, refIso).free;
    if (free >= input.spotsPerDay && (!best || free < best.free)) {
      best = { sublist, free };
    }
  }
  if (best) {
    return {
      type: "fit",
      sublist: best.sublist,
      remaining: best.free - input.spotsPerDay,
    };
  }

  const capacity =
    input.spotsPerDay <= HALF_SUBLIST_SPOTS ? HALF_SUBLIST_SPOTS : FULL_SUBLIST_SPOTS;
  const listed = screen.sublists.reduce((sum, s) => sum + s.capacity, 0);
  return {
    type: "new",
    capacity,
    needsMoreHours: listed + capacity > screenCapacity(screen, settings),
    hoursNeeded: Math.ceil((listed + capacity) / (settings.spotsPerHour / 2)) / 2,
  };
}

export function describePlan(plan: PlacementPlan, short = false): string {
  if (plan.type === "duplicate") return `ya está en ${plan.sublist.name}`;
  if (plan.type === "fit") {
    return short
      ? `→ ${plan.sublist.name} · quedarían ${formatCount(plan.remaining)} libres`
      : `entra en ${plan.sublist.name} · quedarían ${formatCount(plan.remaining)} libres`;
  }
  if (short) {
    return `→ sublista nueva de ${formatCount(plan.capacity)}${plan.needsMoreHours ? " · hay que ampliar el horario" : ""}`;
  }
  return `sin espacio · se creará una sublista de ${formatCount(plan.capacity)}${
    plan.needsMoreHours
      ? ` y habrá que ampliar el horario a ${formatHours(Math.min(MAX_OPERATING_HOURS, plan.hoursNeeded))}`
      : ""
  }`;
}

export interface CampaignLocation {
  screen: Screen;
  sublist: Sublist;
  campaign: Campaign;
}

export function allLocations(board: PantallasBoard): CampaignLocation[] {
  const out: CampaignLocation[] = [];
  for (const screen of board.screens) {
    for (const sublist of screen.sublists) {
      for (const campaign of sublist.campaigns) out.push({ screen, sublist, campaign });
    }
  }
  return out;
}

export function findLocation(board: PantallasBoard, campaignId: string) {
  return allLocations(board).find((l) => l.campaign.id === campaignId) ?? null;
}

export function occurrencesOf(board: PantallasBoard, target: Campaign) {
  return allLocations(board)
    .filter((l) => l.campaign.id !== target.id && sameText(l.campaign.client, target.client))
    .map((l) => ({
      ...l,
      sameCampaign:
        sameText(l.campaign.campaign, target.campaign) &&
        l.campaign.startDate === target.startDate &&
        l.campaign.endDate === target.endDate,
    }));
}

export function livingClients(board: PantallasBoard): Set<string> {
  return new Set(allLocations(board).map((l) => clientKey(l.campaign.client)));
}

export interface AttentionGroup {
  key: string;
  status: "EXPIRING" | "FINISHED";
  client: string;
  campaign: string;
  items: CampaignLocation[];
  endDate: string;
  maxEndDate: string;
  days: number | null;
  screens: number;
  spots: number;
}

export function attentionGroups(board: PantallasBoard, refIso: string): AttentionGroup[] {
  const order = new Map(board.screens.map((s, i) => [s.id, i]));
  const groups = new Map<string, AttentionGroup>();
  const keyOf = (value: string) => normalizeText(value).trim().replace(/\s+/g, " ");

  for (const location of allLocations(board)) {
    const status = campaignStatus(location.campaign, refIso);
    if (status !== "EXPIRING" && status !== "FINISHED") continue;
    const key = `${keyOf(location.campaign.client)}|${keyOf(location.campaign.campaign)}|${status}`;
    const group = groups.get(key) ?? {
      key,
      status,
      client: location.campaign.client,
      campaign: location.campaign.campaign,
      items: [],
      endDate: "",
      maxEndDate: "",
      days: null,
      screens: 0,
      spots: 0,
    };
    group.items.push(location);
    groups.set(key, group);
  }

  const ref = parseIso(refIso)!;
  const list = [...groups.values()].map((group) => {
    group.items.sort(
      (a, b) =>
        (order.get(a.screen.id) ?? 0) - (order.get(b.screen.id) ?? 0) ||
        a.sublist.name.localeCompare(b.sublist.name),
    );
    const ends = [
      ...new Set(group.items.map((i) => i.campaign.endDate).filter(Boolean) as string[]),
    ].sort();
    group.endDate = ends[0] ?? "";
    group.maxEndDate = ends[ends.length - 1] ?? "";
    const end = parseIso(group.endDate);
    group.days = end ? daysBetween(ref, end) : null;
    group.screens = new Set(group.items.map((i) => i.screen.id)).size;
    group.spots = group.items.reduce((sum, i) => sum + i.campaign.spotsPerDay, 0);
    return group;
  });

  return list.sort((a, b) =>
    a.status === b.status
      ? a.endDate.localeCompare(b.endDate) || b.screens - a.screens
      : a.status === "EXPIRING"
        ? -1
        : 1,
  );
}

export function attentionDaysText(days: number | null) {
  if (days === null) return "sin fecha final";
  if (days > 1) return `vence en ${days} días`;
  if (days === 1) return "vence mañana";
  if (days === 0) return "vence hoy";
  return `terminó hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
}

export interface UpcomingExpiration extends CampaignLocation {
  days: number;
}

export function upcomingExpirations(
  board: PantallasBoard,
  refIso: string,
): UpcomingExpiration[] {
  const ref = parseIso(refIso)!;
  const out: UpcomingExpiration[] = [];
  for (const location of allLocations(board)) {
    const end = parseIso(location.campaign.endDate);
    if (!end) continue;
    const status = campaignStatus(location.campaign, refIso);
    if (status === "FINISHED" || status === "SCHEDULED" || status === "UNDATED") continue;
    out.push({ ...location, days: daysBetween(ref, end) });
  }
  return out
    .sort((a, b) => a.days - b.days || a.campaign.client.localeCompare(b.campaign.client))
    .filter((x) => x.days <= ALERT_DAYS);
}

export interface LatestOrder {
  client: string;
  campaign: string | null;
  createdAt: string;
  screens: number;
  spots: number;
  fromOrder: boolean;
}

export function latestOrder(
  logs: PantallasLog[],
  board: PantallasBoard,
): LatestOrder | null {
  const living = livingClients(board);
  let latest: PantallasLog | null = null;
  for (const log of logs) {
    if (log.type !== "NEW") continue;
    if (!living.has(clientKey(log.client))) continue;
    if (!latest || log.createdAt > latest.createdAt) latest = log;
  }
  if (!latest) return null;
  let screens = 1;
  let spots = latest.spotsPerDay ?? 0;
  if (latest.orderGroupId) {
    const group = logs.filter(
      (l) => l.type === "NEW" && l.orderGroupId === latest.orderGroupId,
    );
    screens = group.length;
    spots = group.reduce((sum, l) => sum + (l.spotsPerDay ?? 0), 0);
  }
  return {
    client: latest.client,
    campaign: latest.campaign,
    createdAt: latest.createdAt,
    screens,
    spots,
    fromOrder: Boolean(latest.orderGroupId),
  };
}

export function boardTotals(board: PantallasBoard, refIso: string) {
  const totals = {
    capacity: 0,
    used: 0,
    pausedSpots: 0,
    campaigns: 0,
    byStatus: {
      ACTIVE: 0,
      EXPIRING: 0,
      FINISHED: 0,
      SCHEDULED: 0,
      UNDATED: 0,
      PAUSED: 0,
    } as Record<CampaignStatus, number>,
  };
  for (const screen of board.screens) {
    const stats = screenStats(screen, board.settings, refIso);
    totals.capacity += stats.capacity;
    totals.used += stats.used;
    totals.pausedSpots += stats.pausedSpots;
    totals.campaigns += stats.campaigns;
    for (const key of Object.keys(stats.byStatus) as CampaignStatus[]) {
      totals.byStatus[key] += stats.byStatus[key];
    }
  }
  return {
    ...totals,
    pct: totals.capacity ? (totals.used / totals.capacity) * 100 : 0,
  };
}

export function clientNames(board: PantallasBoard): string[] {
  const names = new Map<string, string>();
  for (const { campaign } of allLocations(board)) {
    const key = clientKey(campaign.client);
    if (key && !names.has(key)) names.set(key, campaign.client.trim());
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}
