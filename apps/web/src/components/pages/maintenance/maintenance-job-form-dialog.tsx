"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useMaintenanceCategories,
  useMaintenanceTechnicians,
} from "@/api/maintenance/maintenance.get";
import {
  useCreateMaintenanceJob,
  useUpdateMaintenanceJob,
} from "@/api/maintenance/maintenance.mutations";
import type {
  CreateMaintenanceJobInput,
  MaintenanceJob,
  MaintenanceJobKind,
} from "@/api/maintenance/maintenance.types";
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
import {
  jobTargetLabel,
  MAINTENANCE_KIND_COPY,
  personName,
} from "./maintenance-const";
import {
  MaintenanceTargetPicker,
  type MaintenanceTarget,
} from "./maintenance-target-picker";

type Props = {
  kind: MaintenanceJobKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When present the dialog edits that job instead of creating a new one. */
  job?: MaintenanceJob | null;
};

interface FormState {
  target: MaintenanceTarget | null;
  assignedUserId: string | null;
  categoryId: string | null;
  description: string;
  date: Date | null;
  time: string;
}

/** Sentinel so "no category" is selectable; the Combobox has no clear action. */
const NO_CATEGORY = "__none__";

const EMPTY_FORM: FormState = {
  target: null,
  assignedUserId: null,
  categoryId: null,
  description: "",
  date: null,
  time: "08:00",
};

function applyTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return next;
}

function targetInput(
  target: MaintenanceTarget,
): Omit<
  CreateMaintenanceJobInput,
  "assignedUserId" | "description" | "scheduledAt" | "categoryId"
> {
  if (target.kind === "DIGITAL") {
    return { kind: "DIGITAL", digitalBillboardId: target.screen.id };
  }
  const b = target.billboard;
  return {
    kind: "STATIC",
    billboardId: b.billboardId,
    billboardCode: b.billboardCode,
    address: b.address,
    cityName: b.cityName,
    departmentName: b.departmentName,
    width: b.width,
    height: b.height,
  };
}

export function MaintenanceJobFormDialog({
  kind,
  open,
  onOpenChange,
  job,
}: Props) {
  const isEdit = !!job;
  const copy = MAINTENANCE_KIND_COPY[kind];
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [seededKey, setSeededKey] = useState<string | null>(null);

  const { data: technicians = [], isLoading: loadingTechnicians } =
    useMaintenanceTechnicians(kind, open);
  const { data: categories = [] } = useMaintenanceCategories(kind);

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
        target: null,
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

    if (!form.target) {
      toast.error(copy.missingTarget);
      return;
    }

    createMutation.mutate(
      {
        ...targetInput(form.target),
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
              ? `Orden ${job?.code} · ${(job && jobTargetLabel(job)) ?? "sin código"}`
              : copy.createDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          {isEdit ? null : (
            <MaintenanceTargetPicker
              kind={kind}
              value={form.target}
              onChange={(target) => setForm((prev) => ({ ...prev, target }))}
            />
          )}

          <Combobox
            label="Usuario de mantenimiento"
            required
            placeholder="Selecciona un usuario..."
            emptyLabel={
              loadingTechnicians ? "Cargando usuarios..." : copy.noTechnicians
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
