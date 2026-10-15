"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, MailPlus, Save } from "lucide-react";
import { toast } from "sonner";
import type { AgentTemplateDraftInput } from "@/api/agent/agent.types";
import { useCreateCrmTemplate } from "@/api/crm/crm.mutations";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/components/pages/crm/crm-format";
import { MarkdownPreview } from "@/components/pages/crm/templates/markdown-preview";
import {
  applyVariables,
  SAMPLE_VARIABLES,
} from "@/components/pages/crm/templates/template-variables";
import { AgentPartFrame } from "./agent-part-frame";

export function AgentTemplateDraftCard({
  draft,
}: {
  draft: AgentTemplateDraftInput;
}) {
  const createTemplate = useCreateCrmTemplate();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    createTemplate.mutate(
      {
        name: draft.name,
        subject: draft.subject,
        body: draft.body,
        category: draft.category ?? null,
      },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success("Plantilla guardada");
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo guardar la plantilla.")),
      },
    );
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft.body);
    toast.success("Contenido copiado");
  }

  return (
    <AgentPartFrame
      icon={MailPlus}
      title={draft.name}
      description={applyVariables(draft.subject, SAMPLE_VARIABLES)}
      actions={
        draft.category ? (
          <Badge variant="secondary" className="text-[11px]">
            {draft.category}
          </Badge>
        ) : null
      }
    >
      <div className="max-h-72 overflow-y-auto px-4 py-3">
        <MarkdownPreview markdown={applyVariables(draft.body, SAMPLE_VARIABLES)} />
      </div>
      <p className="border-t px-3 py-1.5 text-[11px] text-muted-foreground">
        Vista previa con datos de ejemplo. Las variables se reemplazan al enviar.
      </p>
      <div className="grid grid-cols-2 gap-2 border-t p-3">
        <Button variant="outline" className="justify-center" icon={Copy} onClick={handleCopy}>
          Copiar
        </Button>
        {saved ? (
          <Button asChild variant="secondary" className="justify-center">
            <Link href="/dashboard/crm/plantillas">
              <Check className="size-4" />
              Ver en Plantillas
            </Link>
          </Button>
        ) : (
          <Button
            className="justify-center"
            icon={Save}
            loading={createTemplate.isPending}
            onClick={handleSave}
          >
            Guardar plantilla
          </Button>
        )}
      </div>
    </AgentPartFrame>
  );
}
