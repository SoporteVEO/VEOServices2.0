import type { DigitalOrder, OrderStatus, Screen } from "@/api/pantallas/pantallas.types";
import type { OrderRowState } from "../pantallas/order-intake-row";
import { parseAmount } from "../pantallas/pantallas-format";
import { billingDays, validityDays } from "../pantallas/pantallas-logic";

export type OrderFilter = OrderStatus | "ALL";

export const ORDER_FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "PENDING", label: "por revisar" },
  { value: "RETURNED", label: "devueltas" },
  { value: "INGESTED", label: "ingresadas" },
  { value: "ALL", label: "todas" },
];

export function countOrders(orders: DigitalOrder[], filter: OrderFilter) {
  return filter === "ALL" ? orders.length : orders.filter((o) => o.status === filter).length;
}

export function filterOrders(orders: DigitalOrder[], filter: OrderFilter) {
  return filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
}

export function orderDays(order: Pick<DigitalOrder, "startDate" | "endDate">) {
  return validityDays(order.startDate, order.endDate) ?? 0;
}

export function orderTotals(order: DigitalOrder) {
  const days = orderDays(order);
  const spots = order.screens.reduce((sum, s) => sum + s.spotsPerDay * days, 0);
  return { days, spots };
}

export function draftTotals(
  screens: Screen[],
  rows: Record<string, OrderRowState>,
  startDate: string | null,
  endDate: string | null,
) {
  const days = billingDays(startDate, endDate);
  const active = screens.filter((s) => (rows[s.id]?.spots ?? 0) > 0);
  const values = active
    .map((s) => parseAmount(rows[s.id].monthly))
    .filter((value): value is number => value !== null);
  return {
    days,
    active,
    spots: active.reduce((sum, s) => sum + rows[s.id].spots * days, 0),
    total: values.reduce((sum, value) => sum + value, 0),
    withValue: values.length,
  };
}

export function orderLabel(order: Pick<DigitalOrder, "client" | "code">) {
  return `OP DOOH_${order.client.toUpperCase()}_${order.code}`;
}

/** Completes a pasted link ("drive.google.com/…") and returns null when it does not look like one. */
export function normalizeLink(value: string): string | null {
  const text = value.trim();
  if (!text) return "";
  if (/\s/.test(text) || !text.includes(".")) return null;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
}

export function shortLink(url: string, max = 64) {
  const text = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function agencyLabel(order: Pick<DigitalOrder, "hasAgency" | "agencyName">) {
  return order.hasAgency ? (order.agencyName ?? "agencia") : "directo";
}
