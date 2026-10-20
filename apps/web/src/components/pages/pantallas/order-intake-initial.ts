import type { DigitalOrder, DigitalOrderScreen } from "@/api/pantallas/pantallas.types";
import { ART_FORMAT_LABELS } from "./pantallas-const";
import { EMPTY_ORDER_ROW, type OrderRowState } from "./order-intake-row";

const NOTES_MAX_LENGTH = 2000;

function rowFromScreen(screen: DigitalOrderScreen): OrderRowState {
  return {
    ...EMPTY_ORDER_ROW,
    spots: screen.spotsPerDay,
    monthly: screen.monthlyValue === null ? "" : String(screen.monthlyValue),
    spotInput:
      screen.spotValueManual && screen.spotValue !== null ? String(screen.spotValue) : "",
    spotTouched: screen.spotValueManual && screen.spotValue !== null,
    deal: screen.deal,
  };
}

export function orderIntakeNotes(order: DigitalOrder) {
  return [
    `OP ${order.code}${order.revision > 1 ? ` (corrección ${order.revision})` : ""}`,
    order.executive && `Ejecutivo: ${order.executive}`,
    order.hasAgency ? `Agencia: ${order.agencyName ?? "sí"}` : "Cliente directo",
    `Arte: ${ART_FORMAT_LABELS[order.artFormat].toLowerCase()}`,
    order.links.length && `Editables: ${order.links.join(" · ")}`,
    order.instructions && `Indicaciones: ${order.instructions}`,
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, NOTES_MAX_LENGTH);
}

export function orderIntakeInitial(order: DigitalOrder) {
  const rows: Record<string, OrderRowState> = {};
  for (const screen of order.screens) {
    if (screen.screenId) rows[screen.screenId] = rowFromScreen(screen);
  }
  return {
    client: order.client,
    campaign: order.campaign,
    startDate: order.startDate,
    endDate: order.endDate,
    notes: orderIntakeNotes(order),
    rows,
  };
}
