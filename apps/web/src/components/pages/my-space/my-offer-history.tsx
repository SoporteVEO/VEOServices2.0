"use client";

import type {
  OfferDetail,
  OfferEventEntry,
  OfferEventType,
} from "@/api/offers/offers.types";
import { Badge } from "@/components/primitives/ui/badge";
import { formatBriloShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { OfferChangeDiff } from "./offer-change-diff";
import { OFFER_EDIT_REASON_LABELS } from "./quotation/offer-edit-reasons";

const EVENT_LABELS: Record<OfferEventType, string> = {
  CREATED: "Cotización creada",
  UPDATED: "Datos actualizados",
  ITEMS_UPDATED: "Ítems actualizados",
  PDF_ATTACHED: "PDF regenerado",
  CONTRACT_GENERATED: "Contrato generado",
  ACCEPTED: "Aceptada",
  DECLINED: "Rechazada",
  REOPENED: "Reabierta",
  BRILO_SYNCED: "Documentos creados en Brilo",
  BRILO_SYNC_FAILED: "Error al crear en Brilo",
  BRILO_COTIZACION_CREATED: "Cotización creada en Brilo",
  BRILO_COTIZACION_FAILED: "Error al crear la cotización en Brilo",
  BRILO_CONTRATO_CREATED: "Contrato creado en Brilo",
  BRILO_CONTRATO_FAILED: "Error al crear el contrato en Brilo",
};

const EVENT_DOT: Record<OfferEventType, string> = {
  CREATED: "bg-sky-500",
  UPDATED: "bg-amber-500",
  ITEMS_UPDATED: "bg-amber-500",
  PDF_ATTACHED: "bg-slate-400",
  CONTRACT_GENERATED: "bg-slate-400",
  ACCEPTED: "bg-emerald-500",
  DECLINED: "bg-red-500",
  REOPENED: "bg-violet-500",
  BRILO_SYNCED: "bg-emerald-500",
  BRILO_SYNC_FAILED: "bg-red-500",
  BRILO_COTIZACION_CREATED: "bg-emerald-500",
  BRILO_COTIZACION_FAILED: "bg-red-500",
  BRILO_CONTRATO_CREATED: "bg-emerald-500",
  BRILO_CONTRATO_FAILED: "bg-red-500",
};

const FAILED_EVENTS = new Set<OfferEventType>([
  "BRILO_SYNC_FAILED",
  "BRILO_COTIZACION_FAILED",
  "BRILO_CONTRATO_FAILED",
]);

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
              "absolute -left-[26px] top-1 size-2.5 ring-2 ring-background",
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

          <p
            className={cn(
              "pt-0.5 text-xs",
              FAILED_EVENTS.has(event.type)
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {event.message}
          </p>
          <p className="pt-0.5 text-[11px] text-muted-foreground">
            por {actorName(event.actor)}
          </p>

          <EditReason event={event} />

          {event.changes ? (
            <OfferChangeDiff changes={event.changes} offer={offer} />
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function EditReason({ event }: { event: OfferEventEntry }) {
  const countChanged =
    event.billboardsBefore != null &&
    event.billboardsAfter != null &&
    event.billboardsBefore !== event.billboardsAfter;
  if (!event.editReason && !event.editReasonNote && !countChanged) return null;

  return (
    <div className="mt-2 space-y-1 rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-[11px]">
      <div className="flex flex-wrap items-center gap-1.5">
        {event.editReason ? (
          <Badge variant="secondary" className="text-[11px]">
            {OFFER_EDIT_REASON_LABELS[event.editReason]}
          </Badge>
        ) : null}
        {countChanged ? (
          <span className="tabular-nums text-muted-foreground">
            Vallas: {event.billboardsBefore} → {event.billboardsAfter}
          </span>
        ) : null}
      </div>
      {event.editReasonNote ? (
        <p className="whitespace-pre-wrap text-foreground">
          {event.editReasonNote}
        </p>
      ) : null}
    </div>
  );
}