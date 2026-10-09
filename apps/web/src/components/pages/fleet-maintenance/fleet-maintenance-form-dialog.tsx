"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateFleetMaintenance,
  useUpdateFleetMaintenance,
} from "@/api/fleet/fleet.mutations";
import type {
  FleetMaintenance,
  FleetServiceType,
  FleetVehicleDetail,
} from "@/api/fleet/fleet.types";
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
import {
  FLEET_SERVICE_TYPE_LABELS,
  FLEET_SERVICE_TYPE_ORDER,
  formatKm,
  parseOptionalNumber,
} from "./fleet-const";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: FleetVehicleDetail;
  /** When present the dialog edits that record instead of creating one. */
  service?: FleetMaintenance | null;
};

interface FormState {
  type: FleetServiceType;
  performedAt: Date | null;
  mileageKm: string;
  cost: string;
  description: string;
  workshop: string;
  invoiceNumber: string;
  nextServiceKm: string;
  nextServiceAt: Date | null;
}

function emptyForm(): FormState {
  return {
    type: "PREVENTIVE",
    performedAt: new Date(),
    mileageKm: "",
    cost: "",
    description: "",
    workshop: "",
    invoiceNumber: "",
    nextServiceKm: "",
    nextServiceAt: null,
  };
}

function formFromService(service: FleetMaintenance): FormState {
  return {
    type: service.type,
    performedAt: new Date(service.performedAt),
    mileageKm: String(service.mileageKm),
    cost: String(service.cost),
    description: service.description,
    workshop: service.workshop ?? "",
    invoiceNumber: service.invoiceNumber ?? "",
    nextServiceKm: service.nextServiceKm?.toString() ?? "",
    nextServiceAt: service.nextServiceAt
      ? new Date(service.nextServiceAt)
      : null,
  };
}

/** Dates are picked without a time; noon keeps them on the same day in any timezone. */
function toNoonIso(date: Date): string {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  return next.toISOString();
}

export function FleetMaintenanceFormDialog({
  open,
  onOpenChange,
  vehicle,
  service,
}: Props) {
  const isEdit = !!service;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [seededKey, setSeededKey] = useState<string | null>(null);

  const createMutation = useCreateFleetMaintenance();
  const updateMutation = useUpdateFleetMaintenance();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const seedKey = open ? (service?.id ?? "new") : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm(service && seedKey ? formFromService(service) : emptyForm());
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.performedAt) {
      toast.error("Selecciona la fecha del mantenimiento.");
      return;
    }
    const mileageKm = parseOptionalNumber(form.mileageKm);
    if (mileageKm === undefined || !Number.isInteger(mileageKm) || mileageKm < 0) {
      toast.error("Ingresa el kilometraje como número entero.");
      return;
    }
    const cost = parseOptionalNumber(form.cost);
    if (cost === undefined || cost < 0) {
      toast.error("Ingresa el monto gastado.");
      return;
    }
    if (form.description.trim().length < 3) {
      toast.error("Describe el trabajo realizado.");
      return;
    }
    const nextServiceKm = parseOptionalNumber(form.nextServiceKm);
    if (
      nextServiceKm !== undefined &&
      (!Number.isInteger(nextServiceKm) || nextServiceKm < 0)
    ) {
      toast.error("El kilometraje del próximo servicio no es válido.");
      return;
    }

    const payload = {
      type: form.type,
      performedAt: toNoonIso(form.performedAt),
      mileageKm,
      cost: Math.round(cost * 100) / 100,
      description: form.description.trim(),
      workshop: form.workshop.trim() || null,
      invoiceNumber: form.invoiceNumber.trim() || null,
      nextServiceKm: nextServiceKm ?? null,
      nextServiceAt: form.nextServiceAt ? toNoonIso(form.nextServiceAt) : null,
    };

    const handlers = {
      onSuccess: () => {
        toast.success(
          isEdit ? "Mantenimiento actualizado." : "Mantenimiento registrado.",
        );
        onOpenChange(false);
      },
      onError: (error: unknown) =>
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudo guardar el mantenimiento.",
        ),
    };

    if (isEdit && service) {
      updateMutation.mutate({ id: service.id, ...payload }, handlers);
    } else {
      createMutation.mutate({ vehicleId: vehicle.id, ...payload }, handlers);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar mantenimiento" : "Registrar mantenimiento"}
          </DialogTitle>
          <DialogDescription>
            {vehicle.plate} · Último registro:{" "}
            {formatKm(vehicle.lastMaintenanceKm)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Tipo de mantenimiento"
              value={form.type}
              onValueChange={(value) => update("type", value as FleetServiceType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLEET_SERVICE_TYPE_ORDER.map((type) => (
                  <SelectItem key={type} value={type}>
                    {FLEET_SERVICE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePicker
              label="Fecha del mantenimiento"
              required
              value={form.performedAt}
              maxDate={new Date()}
              onChange={(date) => update("performedAt", date ?? null)}
            />
            <Input
              label="Kilometraje"
              required
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Ej. 50000"
              value={form.mileageKm}
              onChange={(event) => update("mileageKm", event.target.value)}
            />
            <Input
              label="Monto gastado (USD)"
              required
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Ej. 125.50"
              value={form.cost}
              onChange={(event) => update("cost", event.target.value)}
            />
            <Input
              label="Taller o proveedor"
              placeholder="Ej. Taller Central"
              value={form.workshop}
              onChange={(event) => update("workshop", event.target.value)}
            />
            <Input
              label="N.º de factura"
              placeholder="Opcional"
              value={form.invoiceNumber}
              onChange={(event) => update("invoiceNumber", event.target.value)}
            />
          </div>

          <Textarea
            label="Trabajo realizado"
            rows={3}
            placeholder="Ej. Cambio de aceite y filtros, revisión de frenos..."
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Próximo servicio (km)"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Opcional"
              value={form.nextServiceKm}
              onChange={(event) => update("nextServiceKm", event.target.value)}
            />
            <DatePicker
              label="Próximo servicio (fecha)"
              value={form.nextServiceAt}
              allowClear
              placeholder="Opcional"
              onChange={(date) => update("nextServiceAt", date ?? null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isBusy}>
            {isEdit ? "Guardar cambios" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
