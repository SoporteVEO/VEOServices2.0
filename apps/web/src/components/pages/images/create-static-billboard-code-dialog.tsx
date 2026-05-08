"use client";

import { toast } from "sonner";
import { useCreateStaticBillboardCode } from "@/api/static-billboard-codes/static-billboard-codes.post";
import type { StaticBillboardCode } from "@/api/static-billboard-codes/static-billboard-codes.get";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreateStaticBillboardCodeForm,
  type StaticBillboardCodeFormValues,
} from "./create-static-billboard-code-form";
import { useState } from "react";

interface CreateStaticBillboardCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (created: StaticBillboardCode) => void;
}

export function CreateStaticBillboardCodeDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateStaticBillboardCodeDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const createMutation = useCreateStaticBillboardCode({
    onSuccess: (created) => {
      toast.success(`Código "${created.code}" creado.`);
      onCreated?.(created);
      onOpenChange(false);
      setErrorMessage(undefined);
    },
    onError: (error) => {
      setErrorMessage(error.message || "No se pudo crear el código.");
      toast.error(error.message || "No se pudo crear el código.");
    },
  });

  function handleSubmit(values: StaticBillboardCodeFormValues) {
    createMutation.mutate({ code: values.code.trim().toUpperCase() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Nuevo código de valla</DialogTitle>
        </DialogHeader>

        <CreateStaticBillboardCodeForm
          key={String(open)}
          isPending={createMutation.isPending}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
