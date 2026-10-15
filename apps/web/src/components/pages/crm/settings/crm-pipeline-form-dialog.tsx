"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateCrmPipeline,
  useUpdateCrmPipeline,
} from "@/api/crm/crm.mutations";
import type { CrmPipeline, CrmStageInput } from "@/api/crm/crm.types";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_STAGE_COLOR } from "../crm-const";
import { errorMessage } from "../crm-format";
import { CrmStageEditor, type StageDraft } from "./crm-stage-editor";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline?: CrmPipeline | null;
};

const TEMPLATE_STAGES: Omit<StageDraft, "uid">[] = [
  { name: "Prospecto", color: "#94A3B8", probability: "10", kind: "OPEN", rottingDays: "14", lockedDeals: 0 },
  { name: "Contactado", color: "#38BDF8", probability: "25", kind: "OPEN", rottingDays: "10", lockedDeals: 0 },
  { name: "Propuesta", color: "#A78BFA", probability: "50", kind: "OPEN", rottingDays: "7", lockedDeals: 0 },
  { name: "Negociación", color: "#F59E0B", probability: "75", kind: "OPEN", rottingDays: "7", lockedDeals: 0 },
  { name: "Ganado", color: "#22C55E", probability: "100", kind: "WON", rottingDays: "", lockedDeals: 0 },
  { name: "Perdido", color: "#EF4444", probability: "0", kind: "LOST", rottingDays: "", lockedDeals: 0 },
];

interface FormState {
  name: string;
  description: string;
  isDefault: boolean;
  stages: StageDraft[];
}

function newUid(): string {
  return crypto.randomUUID();
}

function toForm(pipeline: CrmPipeline | null | undefined): FormState {
  if (!pipeline) {
    return {
      name: "",
      description: "",
      isDefault: false,
      stages: TEMPLATE_STAGES.map((stage) => ({ ...stage, uid: newUid() })),
    };
  }
  return {
    name: pipeline.name,
    description: pipeline.description ?? "",
    isDefault: pipeline.isDefault,
    stages: pipeline.stages.map((stage) => ({
      uid: stage.id,
      id: stage.id,
      name: stage.name,
      color: stage.color ?? DEFAULT_STAGE_COLOR,
      probability: String(stage.probability),
      kind: stage.kind,
      rottingDays: stage.rottingDays != null ? String(stage.rottingDays) : "",
      lockedDeals: stage.openDeals,
    })),
  };
}

function validateStages(stages: StageDraft[]): string | null {
  if (stages.some((stage) => !stage.name.trim())) return "Todas las etapas necesitan nombre.";
  if (stages.filter((s) => s.kind === "WON").length !== 1)
    return "Debe existir exactamente una etapa de tipo Ganado.";
  if (stages.filter((s) => s.kind === "LOST").length !== 1)
    return "Debe existir exactamente una etapa de tipo Perdido.";
  if (!stages.some((s) => s.kind === "OPEN")) return "Agrega al menos una etapa abierta.";
  const badProbability = stages.find((s) => {
    const value = Number(s.probability);
    return s.kind === "OPEN" && (!Number.isInteger(value) || value < 0 || value > 100);
  });
  if (badProbability) return `La probabilidad de "${badProbability.name}" debe estar entre 0 y 100.`;
  return null;
}

function toStageInput(stage: StageDraft): CrmStageInput {
  const rotting = Number(stage.rottingDays);
  return {
    id: stage.id,
    name: stage.name.trim(),
    color: stage.color,
    kind: stage.kind,
    probability:
      stage.kind === "WON" ? 100 : stage.kind === "LOST" ? 0 : Number(stage.probability),
    rottingDays:
      stage.kind === "OPEN" && stage.rottingDays && Number.isInteger(rotting) ? rotting : null,
  };
}

export function CrmPipelineFormDialog({ open, onOpenChange, pipeline }: Props) {
  const isEdit = !!pipeline;
  const [form, setForm] = useState<FormState>(() => toForm(pipeline));
  const [seededKey, setSeededKey] = useState<string | null>(null);
  const createMutation = useCreateCrmPipeline();
  const updateMutation = useUpdateCrmPipeline();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const seedKey = open ? (pipeline?.id ?? "new") : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm(toForm(pipeline));
  }

  function addStage() {
    const firstClosed = form.stages.findIndex((s) => s.kind !== "OPEN");
    const draft: StageDraft = {
      uid: newUid(),
      name: "",
      color: DEFAULT_STAGE_COLOR,
      probability: "50",
      kind: "OPEN",
      rottingDays: "",
      lockedDeals: 0,
    };
    const stages = [...form.stages];
    stages.splice(firstClosed === -1 ? stages.length : firstClosed, 0, draft);
    setForm((prev) => ({ ...prev, stages }));
  }

  function handleSave() {
    if (form.name.trim().length < 2) {
      toast.error("Escribe un nombre para el pipeline.");
      return;
    }
    const stageError = validateStages(form.stages);
    if (stageError) {
      toast.error(stageError);
      return;
    }
    const stages = form.stages.map(toStageInput);
    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? "Pipeline actualizado" : "Pipeline creado");
        onOpenChange(false);
      },
      onError: (error: Error) =>
        toast.error(errorMessage(error, "No se pudo guardar el pipeline.")),
    };

    if (isEdit && pipeline) {
      updateMutation.mutate(
        {
          id: pipeline.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          isDefault: form.isDefault || undefined,
          stages,
        },
        callbacks,
      );
      return;
    }
    createMutation.mutate(
      {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        stages,
      },
      callbacks,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar pipeline" : "Nuevo pipeline"}</DialogTitle>
          <DialogDescription>
            Define las etapas por las que pasa un negocio. Las etapas Ganado y Perdido
            cierran el negocio.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Input
            label="Nombre"
            required
            placeholder="Ej. Pantallas LED"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <Textarea
            label="Descripción"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          {isEdit && !pipeline?.isDefault ? (
            <div className="flex items-center gap-2">
              <Switch
                id="crm-pipeline-default"
                checked={form.isDefault}
                onCheckedChange={(isDefault) => setForm((prev) => ({ ...prev, isDefault }))}
              />
              <Label htmlFor="crm-pipeline-default" className="text-sm">
                Usar como pipeline principal
              </Label>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Etapas</h4>
            <Button type="button" sizeVariant="sm" variant="outline" icon={Plus} onClick={addStage}>
              Agregar etapa
            </Button>
          </div>
          <CrmStageEditor
            stages={form.stages}
            onChange={(stages) => setForm((prev) => ({ ...prev, stages }))}
          />
          <p className="text-[11px] text-muted-foreground">
            “Días alerta” marca un negocio como estancado si pasa ese tiempo sin
            actividad en la etapa.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isBusy}>
            {isEdit ? "Guardar cambios" : "Crear pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
