import { addDays, startOfDay } from "date-fns";
import type { CrmSiteKind, InventoryItem, InventoryQuery } from "@/api/crm/crm-ooh.types";
import { calendarDate } from "../crm-format";
import { isoDay, prorate } from "../crm-ooh-format";
import { DEFAULT_SPOTS_PER_DAY } from "../crm-ooh-const";

export interface InventoryFilters {
  from: Date | null;
  to: Date | null;
  kind: CrmSiteKind | "all";
  department: string;
  search: string;
  onlyAvailable: boolean;
}

export const ALL = "all";

export function initialInventoryFilters(flight?: {
  campaignStart: string | null;
  campaignEnd: string | null;
  mediaType?: string | null;
}): InventoryFilters {
  const from = flight?.campaignStart
    ? calendarDate(flight.campaignStart)
    : addDays(startOfDay(new Date()), 1);
  const to = flight?.campaignEnd ? calendarDate(flight.campaignEnd) : addDays(from, 29);
  const kind =
    flight?.mediaType === "STATIC" || flight?.mediaType === "DIGITAL" ? flight.mediaType : ALL;
  return { from, to, kind, department: ALL, search: "", onlyAvailable: true };
}

export function inventoryQuery(
  filters: InventoryFilters,
  search: string,
  extra: Pick<InventoryQuery, "dealId" | "industry"> = {},
): InventoryQuery {
  return {
    from: filters.from ? isoDay(filters.from) : "",
    to: filters.to ? isoDay(filters.to) : "",
    kind: filters.kind === ALL ? undefined : filters.kind,
    department: filters.department === ALL ? undefined : filters.department,
    search: search || undefined,
    onlyAvailable: filters.onlyAvailable || undefined,
    ...extra,
  };
}

export interface SelectedSite {
  item: InventoryItem;
  spotsPerDay: number;
}

export type InventorySelection = Record<string, SelectedSite>;

export function toggleSelection(
  selection: InventorySelection,
  item: InventoryItem,
): InventorySelection {
  const next = { ...selection };
  if (next[item.key]) {
    delete next[item.key];
  } else {
    const free = item.freeSpots ?? DEFAULT_SPOTS_PER_DAY;
    next[item.key] = {
      item,
      spotsPerDay: item.kind === "DIGITAL" ? Math.max(1, Math.min(DEFAULT_SPOTS_PER_DAY, free)) : 0,
    };
  }
  return next;
}

export function selectionTotal(selection: InventorySelection, from: Date, to: Date): number {
  return Object.values(selection).reduce(
    (sum, { item }) => sum + prorate(item.rate, from, to),
    0,
  );
}

export function selectionToSites(selection: InventorySelection) {
  return Object.values(selection).map(({ item, spotsPerDay }) =>
    item.kind === "STATIC"
      ? { kind: item.kind, billboardId: item.billboardId ?? undefined }
      : {
          kind: item.kind,
          digitalBillboardId: item.digitalBillboardId ?? undefined,
          spotsPerDay,
        },
  );
}
