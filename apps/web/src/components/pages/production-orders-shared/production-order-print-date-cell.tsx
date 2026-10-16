"use client";

import { CalendarClock } from "lucide-react";
import type { ProductionOrder } from "@/api/production-orders/production-orders.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  RESCHEDULE_STATUS_STYLES,
  formatPrintClock,
  formatPrintShortDay,
  summarizeOrderPrintSchedule,
} from "./production-order-print-schedule";

export function ProductionOrderPrintDateCell({
  order,
}: {
  order: ProductionOrder;
}) {
  const summary = summarizeOrderPrintSchedule(order);
  const allPrinted =
    summary.printableCount > 0 &&
    summary.printedCount === summary.printableCount;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      {allPrinted ? (
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Impresión finalizada
        </span>
      ) : summary.nextStartAt ? (
        <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
          <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
          {formatPrintShortDay(summary.nextStartAt)} ·{" "}
          {formatPrintClock(summary.nextStartAt)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Sin fecha asignada</span>
      )}
      {summary.printableCount > 0 && !allPrinted ? (
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {summary.scheduledCount}/{summary.printableCount} agendada
          {summary.printableCount === 1 ? "" : "s"}
        </span>
      ) : null}
      {summary.pendingRequestCount > 0 ? (
        <Badge
          variant="outline"
          className={cn(
            "w-fit whitespace-nowrap text-[10px] font-medium",
            RESCHEDULE_STATUS_STYLES.PENDING,
          )}
        >
          Reprogramación solicitada
        </Badge>
      ) : null}
    </div>
  );
}
