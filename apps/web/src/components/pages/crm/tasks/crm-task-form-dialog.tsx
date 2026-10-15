"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateCrmTask, useUpdateCrmTask } from "@/api/crm/crm.mutations";
import type {
  CrmContextQuery,
  CrmPriority,
  CrmTask,
  CrmTaskType,
} from "@/api/crm/crm.types";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogBody,
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
import { TimePicker } from "@/components/ui/time-picker";
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  TASK_TYPE_LABELS,
  TASK_TYPE_ORDER,
} from "../crm-const";
import { errorMessage } from "../crm-format";
import { CrmDealCombobox } from "../shared/crm-deal-combobox";
import { CrmOwnerSelect } from "../shared/crm-owner-select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: CrmTask | null;
  /** Fixed links for tasks created from a deal, client or contact view. */
  context?: CrmContextQuery;
};

interface FormState {
  title: string;
  type: CrmTaskType;
  priority: CrmPriority;
  date: Date | null;
  time: string;
  assigneeId: string;
  deal: { id: string; title: string } | null;
  description: string;
}

function tomorrowMorning(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

function timeOf(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function toForm(task: CrmTask | null | undefined, assigneeId: string): FormState {
  const due = task ? new Date(task.dueAt) : tomorrowMorning();
  return {
    title: task?.title ?? "",
    type: task?.type ?? "FOLLOW_UP",
    priority: task?.priority ?? "MEDIUM",
    date: due,
    time: timeOf(due),
    assigneeId: task?.assignee.id ?? assigneeId,
    deal: task?.deal ?? null,
    description: task?.description ?? "",
  };
}

export function CrmTaskFormDialog({ open, onOpenChange, task, context }: Props) {
  const isEdit = !!task;
  const { data: session } = authClient.useSession();
  const myId = session?.user.id ?? "";
  const [form, setForm] = useState<FormState>(() => toForm(task, myId));
  const [seededKey, setSeededKey] = useState<string | null>(null);

  const createMutation = useCreateCrmTask();
  const updateMutation = useUpdateCrmTask();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const seedKey = open ? (task?.id ?? `new:${myId}`) : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm(toForm(task, myId));
  }

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function handleSubmit() {
    if (form.title.trim().length < 2) {
      toast.error("Escribe un título para la tarea.");
      return;
    }
    if (!form.date) {
      toast.error("Selecciona la fecha de vencimiento.");
      return;
    }
    const due = new Date(form.date);
    const [hours, minutes] = form.time.split(":").map(Number);
    due.setHours(hours ?? 9, minutes ?? 0, 0, 0);

    const base = {
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      dueAt: due.toISOString(),
      assigneeId: form.assigneeId || undefined,
      description: form.description.trim() || null,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? "Tarea actualizada" : "Tarea creada");
        onOpenChange(false);
      },
      onError: (error: Error) =>
        toast.error(errorMessage(error, "No se pudo guardar la tarea.")),
    };

    if (isEdit && task) {
      updateMutation.mutate({ id: task.id, ...base }, callbacks);
      return;
    }
    createMutation.mutate(
      {
        ...base,
        dealId: context?.dealId ?? form.deal?.id ?? null,
        clientId: context?.clientId ?? null,
        contactId: context?.contactId ?? null,
      },
      callbacks,
    );
  }

  const showDealPicker = !isEdit && !context?.dealId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            Programa el siguiente paso para no perder ningún seguimiento.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <Input
            label="Título"
            required
            placeholder="Ej. Llamar para confirmar artes"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label="Tipo"
              value={form.type}
              onValueChange={(type) => patch({ type: type as CrmTaskType })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_TYPE_ORDER.map((type) => (
                  <SelectItem key={type} value={type}>
                    {TASK_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              label="Prioridad"
              value={form.priority}
              onValueChange={(priority) =>
                patch({ priority: priority as CrmPriority })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_ORDER.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DatePicker
              label="Vence"
              required
              value={form.date}
              onChange={(date) => patch({ date: date ?? null })}
            />
            <TimePicker
              label="Hora"
              value={form.time}
              onChange={(time) => patch({ time })}
            />
          </div>
          <CrmOwnerSelect
            label="Asignada a"
            className="w-full"
            value={form.assigneeId}
            onChange={(assigneeId) => patch({ assigneeId })}
          />
          {showDealPicker ? (
            <CrmDealCombobox
              value={form.deal?.id ?? null}
              selected={form.deal}
              onChange={(deal) => patch({ deal })}
            />
          ) : null}
          <Textarea
            label="Descripción"
            rows={3}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isBusy}>
            {isEdit ? "Guardar cambios" : "Crear tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
