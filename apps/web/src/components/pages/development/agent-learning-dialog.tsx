"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateAgentLearning,
  useDeleteAgentLearning,
  useUpdateAgentLearning,
} from "@/api/development/agent-learnings.mutations";
import type { AgentLearning } from "@/api/development/agent-learnings.types";
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
import { Textarea } from "@/components/ui/textarea";
import { LearningStatusBadge } from "./agent-learning-badges";
import { issueUserName } from "./const";
import { LEARNING_SOURCE_LABELS } from "./learning-const";

const MIN_CONTENT = 10;

type Props = {
  open: boolean;
  learning: AgentLearning | null;
  onOpenChange: (open: boolean) => void;
};

/** Creates a lesson when `learning` is null, otherwise edits it. */
export function AgentLearningDialog({ open, learning, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {open ? (
          <LearningForm
            key={learning?.id ?? "new"}
            learning={learning}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function LearningForm({
  learning,
  onDone,
}: {
  learning: AgentLearning | null;
  onDone: () => void;
}) {
  const [content, setContent] = useState(learning?.content ?? "");
  const [example, setExample] = useState(learning?.example ?? "");
  const create = useCreateAgentLearning();
  const update = useUpdateAgentLearning();
  const remove = useDeleteAgentLearning();
  const busy = create.isPending || update.isPending || remove.isPending;
  const trimmed = content.trim();

  const callbacks = (message: string) => ({
    onSuccess: () => {
      toast.success(message);
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleSave() {
    if (learning) {
      update.mutate(
        { id: learning.id, input: { content: trimmed } },
        callbacks("Aprendizaje actualizado"),
      );
    } else {
      create.mutate(
        { content: trimmed, example: example.trim() || undefined },
        callbacks("Aprendizaje creado y activado"),
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {learning ? "Editar aprendizaje" : "Nuevo aprendizaje"}
          {learning ? <LearningStatusBadge status={learning.status} /> : null}
        </DialogTitle>
        <DialogDescription>
          {learning
            ? `${LEARNING_SOURCE_LABELS[learning.source]} · ${issueUserName(learning.proposedBy)}`
            : "Se activa de inmediato y Nexo lo aplicará con todos los usuarios."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <Textarea
          label="Instrucción para Nexo"
          placeholder='Ej.: "Publicidad Comercial, S.A. de C.V." es un cliente. "Compras de Publicidad Comercial" se refiere a las ventas facturadas a ese cliente.'
          rows={4}
          maxLength={600}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        {learning ? (
          learning.example || learning.feedback ? (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Pregunta que lo originó
              </p>
              <p>{learning.example ?? learning.feedback?.question}</p>
            </div>
          ) : null
        ) : (
          <Textarea
            label="Pregunta de ejemplo (opcional)"
            placeholder="Compras de publicidad comercial en lo que va del año"
            rows={2}
            maxLength={500}
            value={example}
            onChange={(event) => setExample(event.target.value)}
          />
        )}
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        {learning ? (
          <Button
            variant="destructive"
            icon={Trash2}
            disabled={busy}
            onClick={() =>
              remove.mutate(learning.id, callbacks("Aprendizaje eliminado"))
            }
          >
            Eliminar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone} disabled={busy}>
            Cancelar
          </Button>
          <Button
            icon={Save}
            disabled={
              busy ||
              trimmed.length < MIN_CONTENT ||
              trimmed === learning?.content
            }
            onClick={handleSave}
          >
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
