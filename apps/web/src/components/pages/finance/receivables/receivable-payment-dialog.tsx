"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { BriloClientOption } from "@/api/offers/offers.types";
import { useReceivableCatalogs } from "@/api/finance/receivables.get";
import {
  useCreateAdvance,
  useCreateClientPayment,
  useCreateInvoicePayment,
} from "@/api/finance/receivables.mutations";
import { Label } from "@/components/primitives/ui/label";
import { BriloClientCombobox } from "@/components/pages/my-space/brilo-client-combobox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toYYYYMMDD } from "@/lib/format";
import { errorText, parseAmount } from "../shared/finance-format";

export type PaymentMode = "invoice" | "client" | "advance";

export interface PaymentPreset {
  mode?: PaymentMode;
  clientCode?: string;
  clientName?: string | null;
  invoiceNumber?: string;
  amount?: number;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: PaymentPreset | null;
};

interface FormState {
  mode: PaymentMode;
  client: BriloClientOption | null;
  presetClientCode: string;
  invoiceType: string;
  invoiceNumber: string;
  date: Date | null;
  amount: string;
  paymentTypeCode: string;
  advanceTypeCode: string;
  bankCode: string;
  paymentDocNumber: string;
  saleDocNumber: string;
  notes: string;
}

const NONE = "__none__";

function formFromPreset(preset?: PaymentPreset | null): FormState {
  return {
    mode: preset?.mode ?? "invoice",
    client: null,
    presetClientCode: preset?.clientCode ?? "",
    invoiceType: "",
    invoiceNumber: preset?.invoiceNumber ?? "",
    date: new Date(),
    amount: preset?.amount ? preset.amount.toFixed(2) : "",
    paymentTypeCode: "",
    advanceTypeCode: "",
    bankCode: "",
    paymentDocNumber: "",
    saleDocNumber: "",
    notes: "",
  };
}

const MODE_COPY: Record<PaymentMode, string> = {
  invoice: "Aplica el pago a una factura específica.",
  client: "Brilo distribuye el pago entre las facturas pendientes, de la más antigua a la más reciente.",
  advance: "Registra un anticipo del cliente para aplicarlo luego.",
};

export function ReceivablePaymentDialog({ open, onOpenChange, preset }: Props) {
  const [form, setForm] = useState<FormState>(() => formFromPreset(preset));
  const [wasOpen, setWasOpen] = useState(open);
  const { data: catalogs } = useReceivableCatalogs();
  const invoicePayment = useCreateInvoicePayment();
  const clientPayment = useCreateClientPayment();
  const advance = useCreateAdvance();
  const isBusy =
    invoicePayment.isPending || clientPayment.isPending || advance.isPending;

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setForm(formFromPreset(preset));
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const clientCode = form.client?.cliNumero ?? form.presetClientCode;
  const optional = (value: string) =>
    value.trim() && value !== NONE ? value.trim() : undefined;

  function handleSubmit() {
    const amount = parseAmount(form.amount);
    if (!(amount > 0)) return toast.error("Ingresa un monto mayor a cero.");
    if (!form.paymentTypeCode) return toast.error("Selecciona la forma de pago.");

    const base = {
      amount,
      paymentTypeCode: form.paymentTypeCode,
      paymentDocNumber: optional(form.paymentDocNumber),
      bankCode: optional(form.bankCode),
      notes: optional(form.notes),
    };
    const callbacks = {
      onSuccess: () => {
        toast.success("Pago registrado en Brilo.");
        onOpenChange(false);
      },
      onError: (error: unknown) =>
        toast.error(errorText(error, "No se pudo registrar el pago.")),
    };

    if (form.mode === "invoice") {
      if (!form.date) return toast.error("Selecciona la fecha del pago.");
      if (!form.invoiceType.trim() || !form.invoiceNumber.trim()) {
        return toast.error("Indica el tipo y número de la factura.");
      }
      invoicePayment.mutate(
        {
          ...base,
          date: toYYYYMMDD(form.date),
          invoiceType: form.invoiceType.trim(),
          invoiceNumber: form.invoiceNumber.trim(),
        },
        callbacks,
      );
      return;
    }

    if (!clientCode) return toast.error("Selecciona el cliente.");

    if (form.mode === "client") {
      if (!form.date) return toast.error("Selecciona la fecha del pago.");
      clientPayment.mutate(
        {
          ...base,
          date: toYYYYMMDD(form.date),
          clientCode,
          advanceTypeCode: optional(form.advanceTypeCode),
        },
        callbacks,
      );
      return;
    }

    if (!form.advanceTypeCode || form.advanceTypeCode === NONE) {
      return toast.error("Selecciona el tipo de anticipo.");
    }
    advance.mutate(
      {
        ...base,
        clientCode,
        advanceTypeCode: form.advanceTypeCode,
        saleDocNumber: optional(form.saleDocNumber),
      },
      callbacks,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar pago de cliente</DialogTitle>
          <DialogDescription>{MODE_COPY[form.mode]}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <Tabs
            value={form.mode}
            onValueChange={(mode) => set("mode", mode as PaymentMode)}
          >
            <TabsList>
              <TabsTrigger value="invoice">A factura</TabsTrigger>
              <TabsTrigger value="client">A cliente</TabsTrigger>
              <TabsTrigger value="advance">Anticipo</TabsTrigger>
            </TabsList>
          </Tabs>

          {form.mode === "invoice" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Tipo de documento"
                placeholder="Ej. FAC, CCF"
                value={form.invoiceType}
                onChange={(event) => set("invoiceType", event.target.value)}
              />
              <Input
                label="Número de factura"
                value={form.invoiceNumber}
                onChange={(event) => set("invoiceNumber", event.target.value)}
              />
            </div>
          ) : form.presetClientCode && !form.client ? (
            <div className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Cliente</p>
                <p className="font-medium">
                  {preset?.clientName ?? form.presetClientCode}{" "}
                  <span className="font-mono text-xs text-muted-foreground">
                    {form.presetClientCode}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                sizeVariant="sm"
                onClick={() => set("presetClientCode", "")}
              >
                Cambiar
              </Button>
            </div>
          ) : (
            <BriloClientCombobox
              label="Cliente"
              value={form.client}
              onChange={(client) => set("client", client)}
            />
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Monto"
              inputMode="decimal"
              placeholder="0.00"
              value={form.amount}
              onChange={(event) => set("amount", event.target.value)}
            />
            {form.mode === "advance" ? (
              <Input
                label="Documento de venta (opcional)"
                value={form.saleDocNumber}
                onChange={(event) => set("saleDocNumber", event.target.value)}
              />
            ) : (
              <DatePicker
                label="Fecha del pago"
                required
                value={form.date}
                onChange={(date) => set("date", date ?? null)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Forma de pago</Label>
              <Select
                value={form.paymentTypeCode}
                onValueChange={(value) => set("paymentTypeCode", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {(catalogs?.paymentTypes ?? []).map((type) =>
                    type.tabCodigo ? (
                      <SelectItem key={type.tabId} value={type.tabCodigo}>
                        {type.tabNombre ?? type.tabCodigo}
                      </SelectItem>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Banco</Label>
              <Select
                value={form.bankCode || NONE}
                onValueChange={(value) => set("bankCode", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin banco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin banco</SelectItem>
                  {(catalogs?.banks ?? []).map((bank) =>
                    bank.bcoCodigo ? (
                      <SelectItem key={bank.bcoId} value={bank.bcoCodigo}>
                        {bank.bcoNombre ?? bank.bcoCodigo}
                      </SelectItem>
                    ) : null,
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="N.º de cheque / transferencia"
              value={form.paymentDocNumber}
              onChange={(event) => set("paymentDocNumber", event.target.value)}
            />
            {form.mode === "invoice" ? null : (
              <div className="flex flex-col gap-2">
                <Label>
                  {form.mode === "advance"
                    ? "Tipo de anticipo"
                    : "Anticipo para excedente"}
                </Label>
                <Select
                  value={form.advanceTypeCode || NONE}
                  onValueChange={(value) => set("advanceTypeCode", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>
                      {form.mode === "advance" ? "Selecciona" : "Ninguno"}
                    </SelectItem>
                    {(catalogs?.advanceTypes ?? []).map((type) =>
                      type.tanvCodigo ? (
                        <SelectItem
                          key={type.tanvCodigo}
                          value={type.tanvCodigo}
                        >
                          {type.tanvNombre ?? type.tanvCodigo}
                        </SelectItem>
                      ) : null,
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Textarea
            label="Notas"
            rows={2}
            value={form.notes}
            onChange={(event) => set("notes", event.target.value)}
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
            Registrar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
