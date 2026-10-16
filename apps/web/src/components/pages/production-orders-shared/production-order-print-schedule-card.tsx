"use client";

import { useState } from "react";
import { CalendarSync, Flame, Printer, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useCancelPrintRescheduleRequest } from "@/api/print-reschedule-requests/print-reschedule-requests.mutations";
import type {
  ItemPrintSchedule,
  PrintRescheduleRequest,
  ProductionOrderItem,
} from "@/api/production-orders/production-orders.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PrintRescheduleRequestDialog } from "./print-reschedule-request-dialog";
import {
  PRINT_SCHEDULE_STATUS_LABELS,
  PRINT_SCHEDULE_STATUS_STYLES,
  RESCHEDULE_STATUS_LABELS,
  RESCHEDULE_STATUS_STYLES,
  canRequestReschedule,
  formatPersonName,
  formatPrintClock,
  formatPrintDay,
  formatPrintMinutes,
  formatPrintShortDay,
} from "./production-order-print-schedule";

type Props = {
  item: ProductionOrderItem;
  readOnly: boolean;
};

export function ProductionOrderPrintScheduleCard({ item, readOnly }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const schedule = item.printSchedule;
  const request = item.latestRescheduleRequest;
  const showRequestButton = !readOnly && canRequestReschedule(item);

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-accent/10 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Printer className="size-3.5 text-muted-foreground" aria-hidden />
          Impresión
        </div>
        {schedule ? (
          <Badge
            variant="outline"
            className={cn(
              "whitespace-nowrap font-medium",
              PRINT_SCHEDULE_STATUS_STYLES[schedule.status],
            )}
          >
            {PRINT_SCHEDULE_STATUS_LABELS[schedule.status]}
          </Badge>
        ) : null}
      </div>

      {schedule ? (
        <ScheduleDetails schedule={schedule} />
      ) : (
        <p className="text-xs text-muted-foreground">
          Aún no tiene fecha de impresión. Producción la agendará en el
          calendario de impresión.
        </p>
      )}

      {request ? (
        <RescheduleRequestSummary request={request} readOnly={readOnly} />
      ) : null}

      {showRequestButton ? (
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          icon={CalendarSync}
          className="self-start"
          onClick={() => setDialogOpen(true)}
        >
          Solicitar reprogramación
        </Button>
      ) : null}

      <PrintRescheduleRequestDialog
        item={item}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function ScheduleDetails({ schedule }: { schedule: ItemPrintSchedule }) {
  if (schedule.status === "COMPLETED" && schedule.completedAt) {
    return (
      <p className="text-sm">
        Impresa el{" "}
        <span className="font-medium">
          {formatPrintDay(schedule.completedAt)}
        </span>{" "}
        a las{" "}
        <span className="font-medium tabular-nums">
          {formatPrintClock(schedule.completedAt)}
        </span>{" "}
        en {schedule.machineName}.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {formatPrintDay(schedule.scheduledStartAt)}
      </p>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Detail
          label="Inicio (set up)"
          value={formatPrintClock(schedule.scheduledStartAt)}
        />
        <Detail
          label="Inicio de impresión"
          value={formatPrintClock(schedule.printStartAt)}
        />
        <Detail
          label="Fin estimado"
          value={formatPrintClock(schedule.scheduledEndAt)}
        />
        <Detail
          label="Duración"
          value={formatPrintMinutes(schedule.plannedTotalMinutes)}
        />
      </dl>
      <p className="text-[11px] text-muted-foreground">
        Máquina {schedule.machineName} · los horarios son estimados y pueden
        ajustarse según la carga del taller.
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 rounded-md border bg-background px-2 py-1.5">
      <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function RescheduleRequestSummary({
  request,
  readOnly,
}: {
  request: PrintRescheduleRequest;
  readOnly: boolean;
}) {
  const cancel = useCancelPrintRescheduleRequest();
  const isPending = request.status === "PENDING";

  async function handleCancel() {
    try {
      await cancel.mutateAsync(request.id);
      toast.success("Solicitud retirada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo retirar la solicitud.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border bg-background p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            "whitespace-nowrap font-medium",
            RESCHEDULE_STATUS_STYLES[request.status],
          )}
        >
          {RESCHEDULE_STATUS_LABELS[request.status]}
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
        <span className="text-[11px] text-muted-foreground">
          {formatPrintShortDay(request.createdAt)} ·{" "}
          {formatPersonName(request.requestedBy)}
        </span>
      </div>
      <p className="text-xs text-foreground/90">{request.reason}</p>
      {request.preferredDate ? (
        <p className="text-[11px] text-muted-foreground">
          Fecha preferida: {formatPrintDay(request.preferredDate)}
        </p>
      ) : null}
      {request.resolutionNote ? (
        <p className="text-[11px] text-muted-foreground">
          Respuesta de producción
          {request.resolvedBy
            ? ` (${formatPersonName(request.resolvedBy)})`
            : ""}
          : {request.resolutionNote}
        </p>
      ) : null}
      {isPending && !readOnly ? (
        <Button
          type="button"
          variant="ghost"
          sizeVariant="sm"
          icon={Undo2}
          loading={cancel.isPending}
          className="self-start text-muted-foreground"
          onClick={() => void handleCancel()}
        >
          Retirar solicitud
        </Button>
      ) : null}
    </div>
  );
}
