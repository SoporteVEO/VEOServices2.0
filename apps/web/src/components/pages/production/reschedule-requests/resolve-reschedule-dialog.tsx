"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useResolvePrintRescheduleRequest } from "@/api/print-reschedule-requests/print-reschedule-requests.mutations";
import type { PrintRescheduleQueueItem } from "@/api/production-orders/production-orders.types";
import { Button } from "@/components/ui/button";
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

export type ResolveDecision = "RESOLVED" | "REJECTED";

type Props = {
  request: PrintRescheduleQueueItem | null;
  decision: ResolveDecision;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResolveRescheduleDialog({
  request,
  decision,
  open,
  onOpenChange,
}: Props) {
  const resolve = useResolvePrintRescheduleRequest();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (resolve.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        {request ? (
          <ResolveForm
            key={`${request.id}-${decision}`}
            request={request}
            decision={decision}
            isSubmitting={resolve.isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (resolutionNote) => {
              try {
                await resolve.mutateAsync({
                  requestId: request.id,
                  status: decision,
                  resolutionNote,
                });
                toast.success(
                  decision === "RESOLVED"
                    ? "Solicitud atendida. Se notificó al asesor."
                    : "Solicitud rechazada. Se notificó al asesor.",
                );
                onOpenChange(false);
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "No se pudo actualizar la solicitud.",
                );
              }
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ResolveForm({
  request,
  decision,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  request: PrintRescheduleQueueItem;
  decision: ResolveDecision;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (resolutionNote: string | undefined) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const isReject = decision === "REJECTED";
  const trimmed = note.trim();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isReject && !trimmed) {
      toast.error("Indica al asesor por qué no se puede reprogramar.");
      return;
    }
    void onSubmit(trimmed || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="contents">
      <DialogHeader>
        <DialogTitle>
          {isReject ? "Rechazar solicitud" : "Marcar solicitud como atendida"}
        </DialogTitle>
        <DialogDescription>
          {request.billboardCode ?? "Valla"} · {request.orderNumber}.{" "}
          {isReject
            ? "El asesor recibirá tu comentario."
            : "Asegúrate de haber movido la valla en el calendario; el asesor verá la nueva fecha."}
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <Textarea
          label={isReject ? "Motivo" : "Comentario (opcional)"}
          required={isReject}
          rows={3}
          placeholder={
            isReject
              ? "Ej. La máquina está llena esa semana…"
              : "Ej. Se adelantó al martes en la mañana."
          }
          value={note}
          disabled={isSubmitting}
          onChange={(event) => setNote(event.target.value)}
        />
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
          variant={isReject ? "destructive" : "default"}
          loading={isSubmitting}
          disabled={isSubmitting || (isReject && !trimmed)}
        >
          {isReject ? "Rechazar" : "Marcar atendida"}
        </Button>
      </DialogFooter>
    </form>
  );
}
