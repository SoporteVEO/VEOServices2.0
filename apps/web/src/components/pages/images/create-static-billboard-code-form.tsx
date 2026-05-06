"use client";

import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";

export interface StaticBillboardCodeFormValues {
  code: string;
}

interface StaticBillboardCodeFormProps {
  isPending?: boolean;
  errorMessage?: string;
  onSubmit: (values: StaticBillboardCodeFormValues) => void;
  onCancel: () => void;
}

export function CreateStaticBillboardCodeForm({
  isPending = false,
  errorMessage,
  onSubmit,
  onCancel,
}: StaticBillboardCodeFormProps) {
  const { register, handleSubmit } = useForm<StaticBillboardCodeFormValues>({
    defaultValues: { code: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogBody className="space-y-4">
        <Input
          label="Código"
          placeholder="Ej. VEO-001"
          autoFocus
          {...register("code", { required: true })}
        />

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          icon={isPending ? Loader2 : undefined}
          iconClassName={isPending ? "animate-spin" : undefined}
        >
          {isPending ? "Creando..." : "Crear código"}
        </Button>
      </DialogFooter>
    </form>
  );
}
