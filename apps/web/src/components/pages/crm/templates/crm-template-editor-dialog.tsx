"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateCrmTemplate,
  useUpdateCrmTemplate,
} from "@/api/crm/crm.mutations";
import type { CrmTemplate } from "@/api/crm/crm.types";
import { NexoWriteButton } from "@/components/dashboard/agent/nexo-write-button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { errorMessage } from "../crm-format";
import { CrmEmailPreviewFrame } from "./crm-email-preview-frame";
import { MarkdownEditor } from "./markdown-editor";
import { applyVariables, SAMPLE_VARIABLES } from "./template-variables";

const STARTER_BODY = `Hola {{contacto.nombre}},

Gracias por tu interés en los espacios publicitarios de **VEO**. Te comparto la propuesta para **{{negocio.titulo}}**:

- Inversión estimada: **{{negocio.valor}}**
- Fecha estimada de cierre: {{negocio.cierre}}

Quedo atento a tus comentarios.

Saludos,
{{asesor.nombre_completo}}`;

const TEMPLATE_SUGGESTIONS = [
  "Primer contacto con una marca nueva",
  "Seguimiento a una cotización enviada",
  "Recordatorio de renovación de contrato",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: CrmTemplate | null;
};

interface FormState {
  name: string;
  subject: string;
  category: string;
  isShared: boolean;
  body: string;
}

function toForm(template: CrmTemplate | null | undefined): FormState {
  return {
    name: template?.name ?? "",
    subject: template?.subject ?? "",
    category: template?.category ?? "",
    isShared: template?.isShared ?? false,
    body: template?.body ?? STARTER_BODY,
  };
}

export function CrmTemplateEditorDialog({ open, onOpenChange, template }: Props) {
  const isEdit = !!template;
  const [form, setForm] = useState<FormState>(() => toForm(template));
  const [tab, setTab] = useState("editor");
  const [seededKey, setSeededKey] = useState<string | null>(null);

  const createMutation = useCreateCrmTemplate();
  const updateMutation = useUpdateCrmTemplate();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const seedKey = open ? (template?.id ?? "new") : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm(toForm(template));
    setTab("editor");
  }

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function handleSave() {
    if (form.name.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!form.subject.trim()) {
      toast.error("El asunto es obligatorio.");
      return;
    }
    if (!form.body.trim()) {
      toast.error("El contenido no puede estar vacío.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      body: form.body,
      category: form.category.trim() || null,
      isShared: form.isShared,
    };
    const callbacks = {
      onSuccess: () => {
        toast.success(isEdit ? "Plantilla actualizada" : "Plantilla creada");
        onOpenChange(false);
      },
      onError: (error: Error) =>
        toast.error(errorMessage(error, "No se pudo guardar la plantilla.")),
    };
    if (isEdit && template) {
      updateMutation.mutate({ id: template.id, ...payload }, callbacks);
    } else {
      createMutation.mutate(payload, callbacks);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="h-[min(92dvh,56rem)] lg:max-w-6xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
          <DialogDescription>
            Usa Markdown para dar formato y variables como{" "}
            <code className="text-xs">{"{{contacto.nombre}}"}</code> para personalizar
            cada correo.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex min-h-0 flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_12rem]">
            <Input
              label="Nombre"
              required
              placeholder="Ej. Seguimiento de cotización"
              value={form.name}
              onChange={(e) => patch({ name: e.target.value })}
            />
            <Input
              label="Asunto"
              required
              placeholder="Propuesta para {{cliente.empresa}}"
              value={form.subject}
              onChange={(e) => patch({ subject: e.target.value })}
            />
            <Input
              label="Categoría"
              placeholder="Seguimiento"
              value={form.category}
              onChange={(e) => patch({ category: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="crm-template-shared"
              checked={form.isShared}
              onCheckedChange={(isShared) => patch({ isShared })}
            />
            <Label htmlFor="crm-template-shared" className="text-sm">
              Compartir con el equipo de Ventas
            </Label>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="email">Vista de correo</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
              <MarkdownEditor
                value={form.body}
                onChange={(body) => patch({ body })}
                previewVariables={SAMPLE_VARIABLES}
                actions={
                  <NexoWriteButton
                    kind="crm_template"
                    current={{
                      subject: form.subject,
                      body: form.body === STARTER_BODY ? "" : form.body,
                    }}
                    context={form.category.trim() ? { categoria: form.category.trim() } : undefined}
                    suggestions={TEMPLATE_SUGGESTIONS}
                    onApply={({ subject, body }) => patch({ subject, body })}
                  />
                }
                className="flex-1"
                editorClassName="min-h-[26rem]"
              />
              <p className="mt-2 text-[11px] text-muted-foreground">
                La vista previa usa datos de ejemplo. Al enviar, las variables se
                reemplazan con la información real del negocio y contacto.
              </p>
            </TabsContent>
            <TabsContent value="email" className="min-h-0 flex-1 data-[state=inactive]:hidden">
              {tab === "email" ? (
                <CrmEmailPreviewFrame
                  subject={applyVariables(form.subject, SAMPLE_VARIABLES)}
                  body={applyVariables(form.body, SAMPLE_VARIABLES)}
                />
              ) : null}
            </TabsContent>
          </Tabs>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={isBusy}>
            {isEdit ? "Guardar cambios" : "Crear plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
