"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Client } from "@/api/clients/clients.types";
import { useCrmPipelines } from "@/api/crm/crm.get";
import { useCreateCrmDeal, useUpdateCrmDeal } from "@/api/crm/crm.mutations";
import type {
  CrmDealDetail,
  CrmDealSource,
  CrmPriority,
} from "@/api/crm/crm.types";
import { ClientCombobox } from "@/components/pages/static-billboards/quotation/client-combobox";
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
import { cn } from "@/lib/utils";
import {
  NONE,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  SOURCE_LABELS,
  SOURCE_ORDER,
} from "../crm-const";
import { calendarDate, errorMessage, toCalendarIso } from "../crm-format";
import { CrmContactCombobox } from "../shared/crm-contact-combobox";
import { CrmContactFormDialog } from "../contacts/crm-contact-form-dialog";
import { CrmOwnerSelect } from "../shared/crm-owner-select";
import {
  CrmDealBriefFields,
  EMPTY_BRIEF,
  briefFromDeal,
  briefToInput,
  type DealBriefState,
} from "./crm-deal-brief-fields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: CrmDealDetail | null;
  pipelineId?: string | null;
  defaultStageId?: string | null;
  defaultClient?: Pick<Client, "id" | "name" | "company"> | null;
  onSaved?: (deal: CrmDealDetail) => void;
};

interface FormState {
  title: string;
  client: Pick<Client, "id" | "name" | "company"> | null;
  contact: { id: string; firstName: string; lastName: string | null } | null;
  ownerId: string;
  stageId: string;
  value: string;
  expectedCloseDate: Date | null;
  priority: CrmPriority;
  source: CrmDealSource | typeof NONE;
  tags: string;
  description: string;
}

function emptyForm(
  ownerId: string,
  stageId: string,
  client: FormState["client"] = null,
): FormState {
  return {
    title: "",
    client,
    contact: null,
    ownerId,
    stageId,
    value: "",
    expectedCloseDate: null,
    priority: "MEDIUM",
    source: NONE,
    tags: "",
    description: "",
  };
}

function clientStub(client: Pick<Client, "id" | "name" | "company">): Client {
  return {
    ...client,
    type: "DIRECT",
    email: "",
    billingEmail: null,
    contact: null,
    briloCliId: null,
    createdAt: "",
    updatedAt: "",
  };
}

export function CrmDealFormDialog({
  open,
  onOpenChange,
  deal,
  pipelineId,
  defaultStageId,
  defaultClient = null,
  onSaved,
}: Props) {
  const isEdit = !!deal;
  const { data: session } = authClient.useSession();
  const { data: pipelines = [] } = useCrmPipelines();
  const pipeline =
    pipelines.find((p) => p.id === (deal?.pipelineId ?? pipelineId)) ??
    pipelines.find((p) => p.isDefault) ??
    pipelines[0];
  const openStages = pipeline?.stages.filter((s) => s.kind === "OPEN") ?? [];
  const firstStageId = defaultStageId ?? openStages[0]?.id ?? "";
  const myId = session?.user.id ?? "";

  const [form, setForm] = useState<FormState>(() => emptyForm(myId, firstStageId));
  const [brief, setBrief] = useState<DealBriefState>(EMPTY_BRIEF);
  const [seededKey, setSeededKey] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const createMutation = useCreateCrmDeal();
  const updateMutation = useUpdateCrmDeal();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const seedKey = open
    ? (deal?.id ?? `new:${firstStageId}:${myId}:${defaultClient?.id ?? ""}`)
    : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    if (deal) {
      setForm({
        title: deal.title,
        client: deal.client,
        contact: deal.contact,
        ownerId: deal.owner.id,
        stageId: deal.stage.id,
        value: deal.value ? String(deal.value) : "",
        expectedCloseDate: deal.expectedCloseDate
          ? calendarDate(deal.expectedCloseDate)
          : null,
        priority: deal.priority,
        source: deal.source ?? NONE,
        tags: deal.tags.join(", "),
        description: deal.description ?? "",
      });
      setBrief(briefFromDeal(deal));
    } else {
      setForm(emptyForm(myId, firstStageId, defaultClient));
      setBrief(EMPTY_BRIEF);
    }
  }

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function handleSubmit() {
    const title = form.title.trim();
    if (title.length < 2) {
      toast.error("Escribe un nombre para el negocio.");
      return;
    }
    const value = form.value.trim() === "" ? 0 : Number(form.value);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("El valor debe ser un número positivo.");
      return;
    }
    const briefResult = briefToInput(brief);
    if ("error" in briefResult) {
      toast.error(briefResult.error);
      return;
    }

    const payload = {
      ...briefResult.input,
      title,
      clientId: form.client?.id ?? null,
      contactId: form.contact?.id ?? null,
      ownerId: form.ownerId || undefined,
      value,
      expectedCloseDate: form.expectedCloseDate
        ? toCalendarIso(form.expectedCloseDate)
        : null,
      priority: form.priority,
      source: form.source === NONE ? null : form.source,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      description: form.description.trim() || null,
    };

    const callbacks = {
      onSuccess: (saved: CrmDealDetail) => {
        toast.success(isEdit ? "Negocio actualizado" : "Negocio creado");
        onSaved?.(saved);
        onOpenChange(false);
      },
      onError: (error: Error) =>
        toast.error(errorMessage(error, "No se pudo guardar el negocio.")),
    };

    if (isEdit && deal) {
      updateMutation.mutate({ id: deal.id, ...payload }, callbacks);
      return;
    }
    if (!pipeline) {
      toast.error("No hay un pipeline disponible.");
      return;
    }
    createMutation.mutate(
      { ...payload, pipelineId: pipeline.id, stageId: form.stageId || undefined },
      callbacks,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar negocio" : "Nuevo negocio"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `${deal?.stage.name} · ${pipeline?.name ?? ""}`
              : `Se agregará al pipeline ${pipeline?.name ?? ""}.`}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <Input
            label="Nombre del negocio"
            required
            placeholder="Ej. Lanzamiento Navidad – 10 vallas + 3 pantallas"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ClientCombobox
              key={seededKey ?? "closed"}
              label="Cliente"
              allowCreate
              value={form.client?.id ?? null}
              defaultSelectedClient={form.client ? clientStub(form.client) : null}
              onChange={(client) =>
                patch({
                  client: client
                    ? { id: client.id, name: client.name, company: client.company }
                    : null,
                  contact: null,
                })
              }
            />
            <CrmContactCombobox
              value={form.contact?.id ?? null}
              clientId={form.client?.id}
              selected={form.contact}
              onChange={(_id, contact) => patch({ contact })}
              onAdd={() => setContactDialogOpen(true)}
            />
          </div>

          <CrmDealBriefFields
            value={brief}
            onChange={(next) => setBrief((prev) => ({ ...prev, ...next }))}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Valor estimado (USD)"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={form.value}
              onChange={(e) => patch({ value: e.target.value })}
            />
            <DatePicker
              label="Cierre estimado"
              allowClear
              value={form.expectedCloseDate}
              onChange={(date) => patch({ expectedCloseDate: date ?? null })}
            />
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-3",
              isEdit ? "sm:grid-cols-2" : "sm:grid-cols-3",
            )}
          >
            {isEdit ? null : (
              <Select
                label="Etapa"
                value={form.stageId}
                onValueChange={(stageId) => patch({ stageId })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Etapa" />
                </SelectTrigger>
                <SelectContent>
                  {openStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
            <Select
              label="Origen"
              value={form.source}
              onValueChange={(source) =>
                patch({ source: source as FormState["source"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin origen</SelectItem>
                {SOURCE_ORDER.map((source) => (
                  <SelectItem key={source} value={source}>
                    {SOURCE_LABELS[source]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CrmOwnerSelect
            label="Responsable"
            className="w-full"
            value={form.ownerId}
            onChange={(ownerId) => patch({ ownerId })}
          />

          <Input
            label="Etiquetas"
            placeholder="Separadas por coma: vallas, pantallas, renovación"
            value={form.tags}
            onChange={(e) => patch({ tags: e.target.value })}
          />

          <Textarea
            label="Descripción"
            rows={3}
            placeholder="Contexto, necesidades del cliente, próximos pasos..."
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
            {isEdit ? "Guardar cambios" : "Crear negocio"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <CrmContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        defaultClient={form.client}
        onSaved={(contact) => patch({ contact })}
      />
    </Dialog>
  );
}
