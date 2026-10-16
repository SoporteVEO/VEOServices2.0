"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useEntryTypes } from "@/api/finance/accounting.get";
import { useCreateEntry } from "@/api/finance/accounting.mutations";
import type { Partida } from "@/api/finance/finance.types";
import { Label } from "@/components/primitives/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toYYYYMMDD } from "@/lib/format";
import { errorText } from "../shared/finance-format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (entry: Partida) => void;
};

interface FormState {
  date: Date | null;
  typeCode: string;
  number: string;
  description: string;
}

const emptyForm = (): FormState => ({
  date: new Date(),
  typeCode: "",
  number: "",
  description: "",
});

export function AccountingEntryFormDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [wasOpen, setWasOpen] = useState(open);
  const { data: entryTypes = [] } = useEntryTypes();
  const createEntry = useCreateEntry();

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const defaultType = entryTypes.find((type) => type.tpaDefault);
      setForm({ ...emptyForm(), typeCode: defaultType?.tpaCodigo ?? "" });
    }
  }

  function handleSubmit() {
    if (!form.date) return toast.error("Selecciona la fecha de la partida.");
    if (!form.typeCode) return toast.error("Selecciona el tipo de partida.");
    if (form.description.trim().length < 3) {
      return toast.error("Escribe una descripción para la partida.");
    }

    createEntry.mutate(
      {
        date: toYYYYMMDD(form.date),
        typeCode: form.typeCode,
        description: form.description.trim(),
        number: form.number.trim() || undefined,
      },
      {
        onSuccess: (entry) => {
          toast.success("Partida creada en Brilo.");
          onOpenChange(false);
          onCreated(entry);
        },
        onError: (error) =>
          toast.error(errorText(error, "No se pudo crear la partida.")),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva partida contable</DialogTitle>
          <DialogDescription>
            Crea el encabezado; luego agrega los movimientos de debe y haber.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePicker
              label="Fecha"
              required
              value={form.date}
              onChange={(date) =>
                setForm((prev) => ({ ...prev, date: date ?? null }))
              }
            />
            <div className="flex flex-col gap-2">
              <Label>Tipo de partida</Label>
              <Select
                value={form.typeCode}
                onValueChange={(typeCode) =>
                  setForm((prev) => ({ ...prev, typeCode }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {entryTypes.map((type) =>
                    type.tpaCodigo ? (
                      <SelectItem key={type.tpaId} value={type.tpaCodigo}>
                        {type.tpaNombre ?? type.tpaCodigo}
                      </SelectItem>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input
            label="Número (opcional)"
            placeholder="Brilo asigna el correlativo si lo dejas vacío"
            value={form.number}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, number: event.target.value }))
            }
          />
          <Textarea
            label="Descripción"
            rows={3}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createEntry.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={createEntry.isPending}>
            Crear partida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
