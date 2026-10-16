"use client";

import { useState } from "react";
import { CalendarCheck, Inbox } from "lucide-react";
import { usePendingPrintRescheduleRequests } from "@/api/print-reschedule-requests/print-reschedule-requests.get";
import type { PrintRescheduleQueueItem } from "@/api/production-orders/production-orders.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PrintRescheduleRequestCard } from "./print-reschedule-request-card";
import {
  ResolveRescheduleDialog,
  type ResolveDecision,
} from "./resolve-reschedule-dialog";

type Props = {
  onOpenCalendar: () => void;
};

export function PrintRescheduleRequestsPanel({ onOpenCalendar }: Props) {
  const { data, isLoading } = usePendingPrintRescheduleRequests();
  const [resolving, setResolving] = useState<{
    request: PrintRescheduleQueueItem;
    decision: ResolveDecision;
  } | null>(null);

  const requests = data ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">
            Solicitudes de reprogramación
          </h3>
          <p className="text-xs text-muted-foreground">
            Los asesores piden mover la impresión de una valla. Ajusta el
            calendario y marca la solicitud como atendida, o recházala con un
            comentario.
          </p>
        </div>
        <Button
          variant="outline"
          sizeVariant="sm"
          icon={CalendarCheck}
          onClick={onOpenCalendar}
        >
          Ir al calendario
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid gap-3 @3xl/main:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            <Inbox className="size-6" aria-hidden />
            No hay solicitudes pendientes.
          </div>
        ) : (
          <div className="grid gap-3 @3xl/main:grid-cols-2">
            {requests.map((request) => (
              <PrintRescheduleRequestCard
                key={request.id}
                request={request}
                onResolve={(decision) => setResolving({ request, decision })}
              />
            ))}
          </div>
        )}
      </div>

      <ResolveRescheduleDialog
        request={resolving?.request ?? null}
        decision={resolving?.decision ?? "RESOLVED"}
        open={resolving !== null}
        onOpenChange={(open) => {
          if (!open) setResolving(null);
        }}
      />
    </div>
  );
}
