"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { useAvailableBillboardsInRange } from "@/api/billboards/billboards.get";
import {
  useMaintenanceCategories,
  useMaintenanceTechnicians,
} from "@/api/maintenance/maintenance.get";
import {
  useCreateMaintenanceJob,
  useUpdateMaintenanceJob,
} from "@/api/maintenance/maintenance.mutations";
import type { MaintenanceJob } from "@/api/maintenance/maintenance.types";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { toYYYYMMDD } from "@/lib/format";
import { personName } from "./maintenance-const";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When present the dialog edits that job instead of creating a new one. */
  job?: MaintenanceJob | null;
};

interface FormState {
  billboard: AvailableBillboardListing | null;
  assignedUserId: string | null;
  categoryId: string | null;
  description: string;
  date: Date | null;
  time: string;
}

/** Sentinel so "no category" is selectable; the Combobox has no clear action. */
const NO_CATEGORY = "__none__";

const EMPTY_FORM: FormState = {
  billboard: null,
  assignedUserId: null,
  categoryId: null,
  description: "",
  date: null,
  time: "08:00",
};

/** 60-day catalog window, wide enough to cover any billboard in the picker. */
function billboardRange(): { from: string; to: string } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 60);
  return { from: toYYYYMMDD(from), to: toYYYYMMDD(to) };
}

function applyTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return next;
}

export function MaintenanceJobFormDialog({ open, onOpenChange, job }: Props) {
  const isEdit = !!job;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [seededKey, setSeededKey] = useState<string | null>(null);

  const [range] = useState(billboardRange);
  const { data: billboards = [], isLoading: loadingBillboards } =
    useAvailableBillboardsInRange({
      from: range.from,
      to: range.to,
      includeUnavailable: true,
      enabled: open && !isEdit,
    });
  const { data: technicians = [], isLoading: loadingTechnicians } =
    useMaintenanceTechnicians(open);
  const { data: categories = [] } = useMaintenanceCategories();

  const createMutation = useCreateMaintenanceJob();
  const updateMutation = useUpdateMaintenanceJob();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  // Seed from the job being edited, and reset once the dialog closes so a
  // reopened dialog never shows stale edits.
  const seedKey = open ? (job?.id ?? "new") : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    if (seedKey === null) {
      setForm(EMPTY_FORM);
    } else if (job) {
      const scheduled = new Date(job.scheduledAt);
      setForm({
        billboard: null,
        assignedUserId: job.assignedUser.id,
        categoryId: job.category?.id ?? null,
        description: job.description,
        date: scheduled,
        time: `${String(scheduled.getHours()).padStart(2, "0")}:${String(
          scheduled.getMinutes(),
        ).padStart(2, "0")}`,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }

  const billboardOptions = useMemo<ComboboxOption[]>(
    () =>
      billboards.map((b) => ({
        value: b.billboardId,
        label: (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {b.billboardCode ?? `#${b.billboardId}`}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {b.address ?? "—"}
              {[b.cityName, b.departmentName].filter(Boolean).length > 0
                ? ` · ${[b.cityName, b.departmentName].filter(Boolean).join(", ")}`
                : ""}
            </span>
          </div>
        ),
        filterValue: `${b.billboardCode ?? ""} ${b.address ?? ""} ${b.cityName ?? ""} ${b.departmentName ?? ""}`,
      })),
    [billboards],
  );

  const technicianOptions = useMemo<ComboboxOption[]>(
    () =>
      technicians.map((t) => ({
        value: t.id,
        label: personName(t),
        filterValue: `${personName(t)} ${t.email}`,
      })),
    [technicians],
  );

  const categoryOptions = useMemo<ComboboxOption[]>(
    () => [
      { value: NO_CATEGORY, label: "Sin categoría", filterValue: "sin" },
      ...categories.map((c) => ({
        value: c.id,
        label: c.name,
        filterValue: c.name,
      })),
    ],
    [categories],
  );

  function handleSubmit() {
    if (!form.assignedUserId) {
      toast.error("Selecciona el usuario de mantenimiento.");
      return;
    }
    if (!form.date) {
      toast.error("Selecciona la fecha del mantenimiento.");
      return;
    }
    if (form.description.trim().length < 5) {
      toast.error("Describe el problema con al menos 5 caracteres.");
      return;
    }

    const scheduledAt = applyTime(form.date, form.time).toISOString();

    if (isEdit && job) {
      updateMutation.mutate(
        {
          id: job.id,
          assignedUserId: form.assignedUserId,
          categoryId: form.categoryId,
          description: form.description.trim(),
          scheduledAt,
        },
        {
          onSuccess: () => {
            toast.success("Orden de mantenimiento actualizada.");
            onOpenChange(false);
          },
          onError: (error) =>
            toast.error(
              error instanceof Error
                ? error.message
                : "No se pudo actualizar la orden.",
            ),
        },
      );
      return;
    }

    if (!form.billboard) {
      toast.error("Selecciona la valla estática.");
      return;
    }

    createMutation.mutate(
      {
        billboardId: form.billboard.billboardId,
        billboardCode: form.billboard.billboardCode,
        address: form.billboard.address,
        cityName: form.billboard.cityName,
        departmentName: form.billboard.departmentName,
        width: form.billboard.width,
        height: form.billboard.height,
        assignedUserId: form.assignedUserId,
        categoryId: form.categoryId,
        description: form.description.trim(),
        scheduledAt,
      },
      {
        onSuccess: (created) => {
          toast.success(`Orden ${created.code} asignada.`);
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "No se pudo crear la orden.",
          ),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Editar orden de mantenimiento"
              : "Nueva orden de mantenimiento"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Orden ${job?.code} · ${job?.billboardCode ?? "sin código"}`
              : "Asigna una valla estática a un usuario de mantenimiento."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          {isEdit ? null : (
            <Combobox
              label="Valla estática"
              required
              placeholder="Selecciona una valla..."
              emptyLabel={
                loadingBillboards ? "Cargando vallas..." : "Sin resultados."
              }
              options={billboardOptions}
              value={form.billboard?.billboardId ?? null}
              isLoading={loadingBillboards}
              onChange={(value) => {
                const found = billboards.find(
                  (b) => b.billboardId === Number(value),
                );
                setForm((prev) => ({ ...prev, billboard: found ?? null }));
              }}
            />
          )}

          <Combobox
            label="Usuario de mantenimiento"
            required
            placeholder="Selecciona un usuario..."
            emptyLabel={
              loadingTechnicians
                ? "Cargando usuarios..."
                : "No hay usuarios con rol Mantenimiento."
            }
            options={technicianOptions}
            value={form.assignedUserId}
            isLoading={loadingTechnicians}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                assignedUserId: value ? String(value) : null,
              }))
            }
          />

          <Combobox
            label="Categoría"
            placeholder="Sin categoría"
            emptyLabel="Aún no hay categorías."
            options={categoryOptions}
            value={form.categoryId ?? NO_CATEGORY}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                categoryId:
                  !value || value === NO_CATEGORY ? null : String(value),
              }))
            }
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePicker
              label="Fecha programada"
              required
              value={form.date}
              onChange={(date) =>
                setForm((prev) => ({ ...prev, date: date ?? null }))
              }
            />
            <TimePicker
              label="Hora"
              value={form.time}
              onChange={(time) => setForm((prev) => ({ ...prev, time }))}
            />
          </div>

          <Textarea
            label="Descripción del problema"
            rows={4}
            placeholder="Describe la falla o el trabajo requerido..."
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
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isBusy}>
            {isEdit ? "Guardar cambios" : "Asignar orden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
