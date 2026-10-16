"use client";

import { useState } from "react";
import { CalendarSync } from "lucide-react";
import { toast } from "sonner";
import { useCreatePrintRescheduleRequest } from "@/api/print-reschedule-requests/print-reschedule-requests.mutations";
import type { ProductionOrderItem } from "@/api/production-orders/production-orders.types";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  formatPrintClock,
  formatPrintDay,
} from "./production-order-print-schedule";

type Props = {
  item: ProductionOrderItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MIN_REASON_LENGTH = 5;

export function PrintRescheduleRequestDialog({
  item,
  open,
  onOpenChange,
}: Props) {
  const create = useCreatePrintRescheduleRequest();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (create.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        {open ? (
          <RescheduleForm
            item={item}
            isSubmitting={create.isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (input) => {
              try {
                await create.mutateAsync({
                  productionOrderItemId: item.id,
                  ...input,
                });
                toast.success(
                  "Solicitud enviada. El equipo de producción fue notificado.",
                );
                onOpenChange(false);
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "No se pudo enviar la solicitud.",
                );
              }
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RescheduleForm({
  item,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  item: ProductionOrderItem;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    reason: string;
    isUrgent: boolean;
    preferredDate?: string;
  }) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();

  const schedule = item.printSchedule;
  const trimmedReason = reason.trim();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (trimmedReason.length < MIN_REASON_LENGTH) {
      toast.error("Explica brevemente el motivo de la reprogramación.");
      return;
    }
    void onSubmit({
      reason: trimmedReason,
      isUrgent,
      preferredDate: preferredDate
        ? new Date(
            preferredDate.getFullYear(),
            preferredDate.getMonth(),
            preferredDate.getDate(),
            12,
          ).toISOString()
        : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>Solicitar reprogramación</DialogTitle>
        <DialogDescription>
          {item.billboardCode ?? "Valla"} ·{" "}
          {schedule
            ? `agendada para el ${formatPrintDay(schedule.scheduledStartAt)} a las ${formatPrintClock(schedule.scheduledStartAt)}`
            : "aún sin fecha de impresión"}
          . Producción revisará la solicitud y ajustará el calendario.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <DatePicker
          label="Fecha preferida de impresión"
          placeholder="Lo antes posible"
          value={preferredDate}
          onChange={setPreferredDate}
          minDate={new Date()}
          allowClear
          disabled={isSubmitting}
        />

        <Textarea
          label="Motivo"
          required
          rows={3}
          placeholder="Ej. El cliente adelantó el inicio de la campaña…"
          value={reason}
          disabled={isSubmitting}
          onChange={(event) => setReason(event.target.value)}
        />

        <div className="flex items-start gap-3 rounded-md border bg-accent/10 p-3">
          <Switch
            id={`reschedule-urgent-${item.id}`}
            checked={isUrgent}
            disabled={isSubmitting}
            onCheckedChange={setIsUrgent}
          />
          <div className="space-y-0.5">
            <Label
              htmlFor={`reschedule-urgent-${item.id}`}
              className="text-sm"
            >
              Dar prioridad a esta valla
            </Label>
            <p className="text-xs text-muted-foreground">
              Producción verá la solicitud como urgente y la atenderá primero.
            </p>
          </div>
        </div>
      </DialogBody>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          icon={CalendarSync}
          loading={isSubmitting}
          disabled={isSubmitting || trimmedReason.length < MIN_REASON_LENGTH}
        >
          Enviar solicitud
        </Button>
      </DialogFooter>
    </form>
  );
}
