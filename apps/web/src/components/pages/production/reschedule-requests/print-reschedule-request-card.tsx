"use client";

import { Check, Flame, X } from "lucide-react";
import type { PrintRescheduleQueueItem } from "@/api/production-orders/production-orders.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PRINT_SCHEDULE_STATUS_LABELS,
  formatPersonName,
  formatPrintClock,
  formatPrintDay,
  formatPrintShortDay,
} from "@/components/pages/production-orders-shared/production-order-print-schedule";
import { formatSize } from "../calendar/printing-calendar-utils";
import type { ResolveDecision } from "./resolve-reschedule-dialog";

type Props = {
  request: PrintRescheduleQueueItem;
  onResolve: (decision: ResolveDecision) => void;
};

export function PrintRescheduleRequestCard({ request, onResolve }: Props) {
  const schedule = request.printSchedule;
  const movedSinceRequest =
    schedule?.scheduledStartAt !== (request.previousStartAt ?? undefined);

  return (
    <article
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-3",
        request.isUrgent && "border-red-300 dark:border-red-900",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-mono">
              {request.billboardCode ?? "Sin código"}
            </Badge>
            {request.isUrgent ? (
              <Badge
                variant="outline"
                className="gap-1 border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
              >
                <Flame className="size-3" aria-hidden />
                Prioridad
              </Badge>
            ) : null}
          </div>
          <p className="truncate text-sm font-medium">
            {request.customerCompany ?? request.customerName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {request.orderNumber} · {formatSize(request.width, request.height)}
            {request.cityName ? ` · ${request.cityName}` : ""}
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {formatPrintShortDay(request.createdAt)} ·{" "}
          {formatPersonName(request.requestedBy)}
        </span>
      </header>

      <p className="rounded-md bg-accent/20 p-2 text-xs text-foreground/90">
        {request.reason}
      </p>

      <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">
            Fecha actual de impresión
          </dt>
          <dd className="font-medium">
            {schedule ? (
              <>
                {formatPrintDay(schedule.scheduledStartAt)} ·{" "}
                {formatPrintClock(schedule.scheduledStartAt)}
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {schedule.machineName} ·{" "}
                  {PRINT_SCHEDULE_STATUS_LABELS[schedule.status]}
                  {movedSinceRequest ? " · movida desde la solicitud" : ""}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Sin agendar</span>
            )}
          </dd>
        </div>
        <div className="space-y-0.5">
          <dt className="text-[11px] text-muted-foreground">Fecha preferida</dt>
          <dd className="font-medium">
            {request.preferredDate
              ? formatPrintDay(request.preferredDate)
              : "Lo antes posible"}
          </dd>
        </div>
      </dl>

      <footer className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          sizeVariant="sm"
          icon={X}
          onClick={() => onResolve("REJECTED")}
        >
          Rechazar
        </Button>
        <Button sizeVariant="sm" icon={Check} onClick={() => onResolve("RESOLVED")}>
          Marcar atendida
        </Button>
      </footer>
    </article>
  );
}
