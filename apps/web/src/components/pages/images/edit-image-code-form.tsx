"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useStaticBillboardCodes } from "@/api/static-billboard-codes/static-billboard-codes.get";
import { CreateStaticBillboardCodeDialog } from "./create-static-billboard-code-dialog";

export interface EditImageCodeFormValues {
  staticBillboardCodeId: string | null;
}

interface EditImageCodeFormProps {
  defaultStaticBillboardCodeId: string | null;
  isPending?: boolean;
  errorMessage?: string;
  onSubmit: (values: EditImageCodeFormValues) => void;
  onCancel: () => void;
}

export function EditImageCodeForm({
  defaultStaticBillboardCodeId,
  isPending = false,
  errorMessage,
  onSubmit,
  onCancel,
}: EditImageCodeFormProps) {
  const [staticBillboardCodeId, setStaticBillboardCodeId] = useState<
    string | null
  >(defaultStaticBillboardCodeId);
  const [createCodeOpen, setCreateCodeOpen] = useState(false);

  const { data: codes, isLoading: isLoadingCodes } = useStaticBillboardCodes();

  const codeOptions = useMemo(
    () =>
      (codes ?? []).map((code) => ({
        value: code.id,
        label: code.code,
      })),
    [codes],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({ staticBillboardCodeId });
  }

  const isUnchanged = staticBillboardCodeId === defaultStaticBillboardCodeId;

  return (
    <>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className="space-y-4">
          <Combobox
            label="Código de valla estática"
            placeholder="Selecciona un código"
            emptyLabel="No hay códigos creados."
            options={codeOptions}
            value={staticBillboardCodeId}
            isLoading={isLoadingCodes}
            onChange={(v) =>
              setStaticBillboardCodeId(v == null ? null : String(v))
            }
            addLabel="Crear nuevo código"
            onAdd={() => setCreateCodeOpen(true)}
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

      <CreateStaticBillboardCodeDialog
        open={createCodeOpen}
        onOpenChange={setCreateCodeOpen}
        onCreated={(created) => setStaticBillboardCodeId(created.id)}
      />
    </>
  );
}
