"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateMyAbsence } from "@/api/absences/absences.mutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fileToBase64 } from "@/components/pages/absences";
import { AbsenceForm, type AbsenceFormResult } from "./absence-form";

type AbsenceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AbsenceFormDialog({
  open,
  onOpenChange,
}: AbsenceFormDialogProps) {
  const createMutation = useCreateMyAbsence();
  const [isEncoding, setIsEncoding] = useState(false);

  const isPending = createMutation.isPending || isEncoding;

  async function handleSubmit(values: AbsenceFormResult) {
    try {
      setIsEncoding(true);
      const images = await Promise.all(
        values.imageFiles.map((file) => fileToBase64(file)),
      );
      setIsEncoding(false);

      createMutation.mutate(
        {
          fromDate: values.fromDate.toISOString(),
          toDate: values.toDate.toISOString(),
          reason: values.reason,
          images,
        },
        {
          onSuccess: () => {
            toast.success("Solicitud de incapacidad creada");
            onOpenChange(false);
          },
          onError: (err: Error) =>
            toast.error(err.message || "Error al crear la solicitud"),
        },
      );
    } catch (err) {
      setIsEncoding(false);
      toast.error(
        err instanceof Error ? err.message : "Error al procesar imágenes",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Nueva solicitud de incapacidad</DialogTitle>
        </DialogHeader>

        <AbsenceForm
          key={open ? "open" : "closed"}
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
