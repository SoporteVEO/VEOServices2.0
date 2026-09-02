"use client";

import type {
  OfferChange,
  OfferDetail,
  OfferEventType,
} from "@/api/offers/offers.types";
import { formatBriloShortDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const EVENT_LABELS: Record<OfferEventType, string> = {
  CREATED: "Cotización creada",
  UPDATED: "Datos actualizados",
  ITEMS_UPDATED: "Ítems actualizados",
  PDF_ATTACHED: "PDF regenerado",
  ACCEPTED: "Aceptada",
  DECLINED: "Rechazada",
  REOPENED: "Reabierta",
};

const EVENT_DOT: Record<OfferEventType, string> = {
  CREATED: "bg-sky-500",
  UPDATED: "bg-amber-500",
  ITEMS_UPDATED: "bg-amber-500",
  PDF_ATTACHED: "bg-slate-400",
  ACCEPTED: "bg-emerald-500",
  DECLINED: "bg-red-500",
  REOPENED: "bg-violet-500",
};

const MONEY_FIELDS = new Set([
  "subtotalImpression",
  "totalImpression",
  "subtotalRental",
  "totalRental",
  "impressionPrice",
  "rentalPrice",
]);

const FIELD_LABELS: Record<string, string> = {
  customerName: "Nombre del cliente",
  customerCompany: "Empresa",
  customerEmail: "Correo",
  billingEmail: "Correo de facturación",
  customerContact: "Contacto",
  clientId: "Cliente vinculado",
  validUntil: "Vigencia",
  specialConditions: "Condiciones especiales",
  status: "Estado",
  briloMconId: "Contrato Brilo",
  subtotalImpression: "Subtotal impresión",
  totalImpression: "Total impresión",
  subtotalRental: "Subtotal arrendamiento",
  totalRental: "Total arrendamiento",
  quantity: "cantidad",
  impressionPrice: "precio de impresión",
  rentalPrice: "precio de arrendamiento",
  taxRate: "impuesto",
  description: "descripción",
  spotCount: "spots",
  startDate: "fecha de inicio",
  endDate: "fecha de fin",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;

/**
 * Change keys are either a plain header field or `item.<signature>[.<field>]`.
 * Only the trailing field name carries a label; the signature is shown as-is
 * so the reader can tell which line changed.
 */
function describeKey(key: string): string {
  if (!key.startsWith("item.")) return FIELD_LABELS[key] ?? key;

  const parts = key.split(".");
  const signature = parts[1] ?? "";
  const field = parts[2];
  const line = signature.replace(":", " ");
  return field ? `${line} · ${FIELD_LABELS[field] ?? field}` : line;
}

function formatValue(key: string, value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "number") {
    const field = key.split(".").pop() ?? key;
    return MONEY_FIELDS.has(field) ? formatMoney(value) : String(value);
  }
  if (typeof value === "string" && ISO_DATE.test(value)) {
    return formatBriloShortDate(value);
  }
  return String(value);
}

function actorName(actor: OfferDetail["events"][number]["actor"]): string {
  if (!actor) return "Sistema";
  return [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim() ||
    actor.email;
}

/**
 * Append-only audit trail for the offer: who changed what, and when.
 */
export function MyOfferHistory({ offer }: { offer: OfferDetail }) {
  if (offer.events.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Aún no hay actividad registrada para esta cotización.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-4 border-l pl-5">
      {offer.events.map((event) => (
        <li key={event.id} className="relative">
          <span
            className={cn(
              "absolute -left-[26px] top-1 size-2.5 rounded-full ring-2 ring-background",
              EVENT_DOT[event.type],
            )}
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-sm font-medium">{EVENT_LABELS[event.type]}</p>
            <time className="text-[11px] text-muted-foreground">
              {formatBriloShortDate(event.createdAt)}
            </time>
          </div>

          <p className="pt-0.5 text-xs text-muted-foreground">
            {event.message}
          </p>
          <p className="pt-0.5 text-[11px] text-muted-foreground">
            por {actorName(event.actor)}
          </p>

          {event.changes ? <ChangeList changes={event.changes} /> : null}
        </li>
      ))}
    </ol>
  );
}

function ChangeList({ changes }: { changes: Record<string, OfferChange> }) {
  const entries = Object.entries(changes);
  if (entries.length === 0) return null;

  return (
    <ul className="mt-2 space-y-1 rounded-md border bg-muted/30 p-2">
      {entries.map(([key, change]) => (
        <li
          key={key}
          className="flex flex-wrap items-baseline gap-x-1.5 text-[11px]"
        >
          <span className="font-medium">{describeKey(key)}:</span>
          <span className="text-muted-foreground line-through">
            {formatValue(key, change.from)}
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium tabular-nums">
            {formatValue(key, change.to)}
          </span>
        </li>
      ))}
    </ul>
  );
}
