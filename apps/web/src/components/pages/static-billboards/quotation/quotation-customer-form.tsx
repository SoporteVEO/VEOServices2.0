"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import type { Client } from "@/api/clients/clients.get";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/primitives/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClientCombobox } from "./client-combobox";

export interface QuotationCustomerFormValues {
  clientId: string | null;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerContact: string;
  validUntil: Date | null;
  specialConditions: string;
}

export interface QuotationCustomerFormProps {
  form: UseFormReturn<QuotationCustomerFormValues>;
  defaultSelectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
}

export function QuotationCustomerForm({
  form,
  defaultSelectedClient,
  onSelectClient,
}: QuotationCustomerFormProps) {
  const { register, control, formState, watch } = form;
  const clientId = watch("clientId");

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">
          Cliente registrado
        </Label>
        <ClientCombobox
          value={clientId}
          defaultSelectedClient={defaultSelectedClient}
          onChange={onSelectClient}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nombre"
          required
          placeholder="Persona de contacto"
          aria-invalid={!!formState.errors.customerName}
          {...register("customerName", { required: true })}
        />
        <Input
          label="Empresa"
          placeholder="Razón social"
          {...register("customerCompany")}
        />
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="cliente@ejemplo.com"
          {...register("customerEmail", {
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Correo no válido",
            },
          })}
          aria-invalid={!!formState.errors.customerEmail}
        />
        <Input
          label="Contacto"
          placeholder="Teléfono o cargo"
          {...register("customerContact")}
        />
        <Controller
          control={control}
          name="validUntil"
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              label="Vigencia oferta"
              required
              value={field.value}
              onChange={(date) => field.onChange(date ?? null)}
              minDate={new Date()}
              placeholder="Selecciona una fecha"
              aria-invalid={!!formState.errors.validUntil}
            />
          )}
        />
        <div className="flex w-full flex-col gap-2 sm:col-span-2">
          <Label
            htmlFor="specialConditions"
            className="text-xs font-medium text-muted-foreground"
          >
            Condiciones especiales
          </Label>
          <Textarea
            id="specialConditions"
            rows={3}
            placeholder="Términos, descuentos, observaciones..."
            {...register("specialConditions")}
          />
        </div>
      </div>
    </section>
  );
}
