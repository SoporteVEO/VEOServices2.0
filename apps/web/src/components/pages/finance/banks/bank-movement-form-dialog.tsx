"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useBankCatalogs } from "@/api/finance/banks.get";
import {
  useCreateBankMovement,
  type BankMovementKind,
} from "@/api/finance/banks.mutations";
import type { BankMovementInput } from "@/api/finance/finance.types";
import { Checkbox } from "@/components/primitives/ui/checkbox";
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
import {
  CostCenterCombobox,
  type CatalogSelection,
} from "../accounting/accounting-catalog-combobox";
import { errorText, parseAmount } from "../shared/finance-format";

type Props = {
  kind: BankMovementKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

interface FormState {
  accountNumber: string;
  typeCode: string;
  amount: string;
  number: string;
  date: Date | null;
  bankDate: Date | null;
  reason: string;
  costCenter: CatalogSelection | null;
  creditor: string;
  chequeDelivered: boolean;
}

const emptyForm = (): FormState => ({
  accountNumber: "",
  typeCode: "",
  amount: "",
  number: "",
  date: new Date(),
  bankDate: null,
  reason: "",
  costCenter: null,
  creditor: "",
  chequeDelivered: false,
});

const COPY: Record<BankMovementKind, { title: string; description: string }> = {
  deposits: {
    title: "Nuevo abono bancario",
    description: "Registra un depósito o nota de abono en una cuenta bancaria.",
  },
  charges: {
    title: "Nuevo cargo bancario",
    description: "Registra un cheque, transferencia o nota de cargo.",
  },
};

export function BankMovementFormDialog({ kind, open, onOpenChange }: Props) {
  const copy = COPY[kind];
  const isCharge = kind === "charges";
  const [form, setForm] = useState<FormState>(emptyForm);
  const [wasOpen, setWasOpen] = useState(open);
  const { data: catalogs } = useBankCatalogs();
  const createMovement = useCreateBankMovement(kind);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const preferred = catalogs?.accounts.find((a) => a.bcuPreferida);
      setForm({ ...emptyForm(), accountNumber: preferred?.bcuNumero ?? "" });
    }
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const accounts = (catalogs?.accounts ?? []).filter(
    (account) => account.bcuNumero && account.bcuActiva !== false,
  );
  const types = isCharge
    ? (catalogs?.chargeTypes ?? []).map((t) => ({
        id: t.tcbId,
        code: t.tcbCodigo,
        name: t.tcbNombre,
      }))
    : (catalogs?.depositTypes ?? []).map((t) => ({
        id: t.tabId,
        code: t.tabCodigo,
        name: t.tabNombre,
      }));

  function handleSubmit() {
    if (!form.accountNumber) return toast.error("Selecciona la cuenta bancaria.");
    if (!form.typeCode) return toast.error("Selecciona el tipo de movimiento.");
    const amount = parseAmount(form.amount);
    if (!(amount > 0)) return toast.error("Ingresa un monto mayor a cero.");

    const payload: BankMovementInput = {
      bankAccountNumber: form.accountNumber,
      typeCode: form.typeCode,
      amount,
      number: form.number.trim() || undefined,
      date: form.date ? toYYYYMMDD(form.date) : undefined,
      bankDate: form.bankDate ? toYYYYMMDD(form.bankDate) : undefined,
      reason: form.reason.trim() || undefined,
      costCenterCode: form.costCenter?.code,
      ...(isCharge
        ? {
            creditor: form.creditor.trim() || undefined,
            chequeDelivered: form.chequeDelivered,
          }
        : {}),
    };

    createMovement.mutate(payload, {
      onSuccess: () => {
        toast.success(isCharge ? "Cargo registrado en Brilo." : "Abono registrado en Brilo.");
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error(errorText(error, "No se pudo registrar el movimiento.")),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Cuenta bancaria</Label>
              <Select
                value={form.accountNumber}
                onValueChange={(value) => set("accountNumber", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.bcuId}
                      value={account.bcuNumero as string}
                    >
                      {[account.bcoCodigo, account.bcuNumero, account.monCodigo]
                        .filter(Boolean)
                        .join(" · ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select
                value={form.typeCode}
                onValueChange={(value) => set("typeCode", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) =>
                    type.code ? (
                      <SelectItem key={type.id} value={type.code}>
                        {type.name ?? type.code}
                      </SelectItem>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Monto"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(event) => set("amount", event.target.value)}
            />
            <Input
              label="Número (opcional)"
              placeholder="Correlativo automático"
              value={form.number}
              onChange={(event) => set("number", event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePicker
              label="Fecha"
              value={form.date}
              onChange={(date) => set("date", date ?? null)}
            />
            <DatePicker
              label="Fecha aplica banco"
              value={form.bankDate}
              onChange={(date) => set("bankDate", date ?? null)}
            />
          </div>

          {isCharge ? (
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
              <Input
                label="Acreedor / beneficiario"
                value={form.creditor}
                onChange={(event) => set("creditor", event.target.value)}
              />
              <div className="flex h-9 items-center gap-2">
                <Checkbox
                  id="bank-charge-cheque-delivered"
                  checked={form.chequeDelivered}
                  onCheckedChange={(checked) =>
                    set("chequeDelivered", checked === true)
                  }
                />
                <Label htmlFor="bank-charge-cheque-delivered">
                  Cheque entregado
                </Label>
              </div>
            </div>
          ) : null}

          <CostCenterCombobox
            label="Centro de costo"
            value={form.costCenter}
            onChange={(costCenter) => set("costCenter", costCenter)}
          />

          <Textarea
            label="Motivo"
            rows={2}
            value={form.reason}
            onChange={(event) => set("reason", event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMovement.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={createMovement.isPending}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
