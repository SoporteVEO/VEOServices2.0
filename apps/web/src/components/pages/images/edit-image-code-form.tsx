"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { StaticBillboardCodeCombobox } from "./static-billboard-code-combobox";

export interface EditImageCodeFormValues {
  staticBillboardCodeId: string | null;
}

interface EditImageCodeFormProps {
  defaultStaticBillboardCode: { id: string; code: string } | null;
  isPending?: boolean;
  errorMessage?: string;
  onSubmit: (values: EditImageCodeFormValues) => void;
  onCancel: () => void;
}

export function EditImageCodeForm({
  defaultStaticBillboardCode,
  isPending = false,
  errorMessage,
  onSubmit,
  onCancel,
}: EditImageCodeFormProps) {
  const [staticBillboardCodeId, setStaticBillboardCodeId] = useState<
    string | null
  >(defaultStaticBillboardCode?.id ?? null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ staticBillboardCodeId });
  }

  const isUnchanged =
    staticBillboardCodeId === (defaultStaticBillboardCode?.id ?? null);

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-4">
        <StaticBillboardCodeCombobox
          label="Código de valla estática"
          value={staticBillboardCodeId}
          onChange={setStaticBillboardCodeId}
          defaultSelectedCode={defaultStaticBillboardCode}
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
          disabled={isPending || isUnchanged}
          icon={isPending ? Loader2 : undefined}
          iconClassName={isPending ? "animate-spin" : undefined}
        >
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  );
}
