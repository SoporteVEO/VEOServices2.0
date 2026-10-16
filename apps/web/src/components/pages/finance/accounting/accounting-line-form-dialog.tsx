"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useAddEntryLine,
  useUpdateEntryLine,
} from "@/api/finance/accounting.mutations";
import type {
  DetallePartida,
  EntryLineInput,
} from "@/api/finance/finance.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { errorText, parseAmount } from "../shared/finance-format";
import {
  AccountCombobox,
  CostCenterCombobox,
  type CatalogSelection,
} from "./accounting-catalog-combobox";

type Props = {
  mpaId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line?: DetallePartida | null;
};

interface FormState {
  account: CatalogSelection | null;
  costCenter: CatalogSelection | null;
  description: string;
  debit: string;
  credit: string;
  documentType: string;
  documentNumber: string;
  subject: string;
  reference: string;
}

const EMPTY_FORM: FormState = {
  account: null,
  costCenter: null,
  description: "",
  debit: "",
  credit: "",
  documentType: "",
  documentNumber: "",
  subject: "",
  reference: "",
};

function formFromLine(line: DetallePartida): FormState {
  return {
    account: line.cueCodigo
      ? { code: line.cueCodigo, name: line.cueNombre }
      : null,
    costCenter: line.cecoCodigo
      ? { code: line.cecoCodigo, name: line.cecoNombre ?? null }
      : null,
    description: line.dpaDescripcion ?? "",
    debit: line.dpaDebe ? String(line.dpaDebe) : "",
    credit: line.dpaHaber ? String(line.dpaHaber) : "",
    documentType: line.dpaTipoDoc ?? "",
    documentNumber: line.dpaNumDoc ?? "",
    subject: line.dpaNomSujeto ?? "",
    reference: line.dpaReferencia ?? "",
  };
}

const optional = (value: string) => value.trim() || undefined;

export function AccountingLineFormDialog({
  mpaId,
  open,
  onOpenChange,
  line,
}: Props) {
  const isEdit = !!line;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [seededKey, setSeededKey] = useState<string | null>(null);
  const addLine = useAddEntryLine();
  const updateLine = useUpdateEntryLine();
  const isBusy = addLine.isPending || updateLine.isPending;

  const seedKey = open ? String(line?.dpaId ?? "new") : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm(line && open ? formFromLine(line) : EMPTY_FORM);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handleSubmit() {
    if (!form.account) return toast.error("Selecciona la cuenta contable.");
    const debit = form.debit.trim() ? parseAmount(form.debit) : 0;
    const credit = form.credit.trim() ? parseAmount(form.credit) : 0;
    if (Number.isNaN(debit) || Number.isNaN(credit) || debit < 0 || credit < 0) {
      return toast.error("Los montos deben ser números positivos.");
    }
    if ((debit > 0) === (credit > 0)) {
      return toast.error("Ingresa un monto en Debe o en Haber, no en ambos.");
    }

    const payload: EntryLineInput = {
      accountCode: form.account.code,
      description: optional(form.description),
      debit,
      credit,
      costCenterCode: form.costCenter?.code,
      documentType: optional(form.documentType),
      documentNumber: optional(form.documentNumber),
      subject: optional(form.subject),
      reference: optional(form.reference),
    };

    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? "Movimiento actualizado." : "Movimiento agregado.");
        onOpenChange(false);
      },
      onError: (error: unknown) =>
        toast.error(errorText(error, "No se pudo guardar el movimiento.")),
    };

    if (line) {
      updateLine.mutate({ mpaId, dpaId: line.dpaId, line: payload }, callbacks);
    } else {
      addLine.mutate({ mpaId, line: payload }, callbacks);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar movimiento" : "Agregar movimiento"}
          </DialogTitle>
          <DialogDescription>
            Cada movimiento lleva un monto en Debe o en Haber.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <AccountCombobox
            label="Cuenta contable"
            required
            value={form.account}
            onChange={(account) => set("account", account)}
          />
          <CostCenterCombobox
            label="Centro de costo"
            value={form.costCenter}
            onChange={(costCenter) => set("costCenter", costCenter)}
          />
          <Input
            label="Concepto"
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Debe"
              inputMode="decimal"
              placeholder="0.00"
              value={form.debit}
              onChange={(event) => set("debit", event.target.value)}
            />
            <Input
              label="Haber"
              inputMode="decimal"
              placeholder="0.00"
              value={form.credit}
              onChange={(event) => set("credit", event.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Tipo de documento"
              value={form.documentType}
              onChange={(event) => set("documentType", event.target.value)}
            />
            <Input
              label="Número de documento"
              value={form.documentNumber}
              onChange={(event) => set("documentNumber", event.target.value)}
            />
            <Input
              label="Referencia"
              value={form.reference}
              onChange={(event) => set("reference", event.target.value)}
            />
          </div>
          <Input
            label="Sujeto"
            placeholder="Cliente o proveedor relacionado"
            value={form.subject}
            onChange={(event) => set("subject", event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isBusy}>
            {isEdit ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
