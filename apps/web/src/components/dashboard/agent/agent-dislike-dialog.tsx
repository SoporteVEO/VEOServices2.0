"use client";

import { useState } from "react";
import { ThumbsDown } from "lucide-react";
import type { AgentFeedbackReason } from "@/api/agent/agent.types";
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
import { cn } from "@/lib/utils";
import {
  FEEDBACK_REASON_LABELS,
  FEEDBACK_REASON_ORDER,
} from "./agent-feedback-const";

export interface DislikeFeedback {
  reason: AgentFeedbackReason;
  comment?: string;
}

interface AgentDislikeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: DislikeFeedback) => void;
}

export function AgentDislikeDialog({
  open,
  onOpenChange,
  onSubmit,
}: AgentDislikeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        {open ? (
          <DislikeForm
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DislikeForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (feedback: DislikeFeedback) => void;
}) {
  const [reason, setReason] = useState<AgentFeedbackReason>("MISUNDERSTOOD");
  const [comment, setComment] = useState("");

  return (
    <>
      <DialogHeader>
        <DialogTitle>¿Qué estuvo mal en la respuesta?</DialogTitle>
        <DialogDescription>
          Tu comentario ayuda a que Nexo responda mejor la próxima vez.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {FEEDBACK_REASON_ORDER.map((value) => (
            <Button
              key={value}
              type="button"
              role="radio"
              aria-checked={reason === value}
              variant={reason === value ? "default" : "outline"}
              sizeVariant="sm"
              className={cn("", reason !== value && "shadow-none")}
              onClick={() => setReason(value)}
            >
              {FEEDBACK_REASON_LABELS[value]}
            </Button>
          ))}
        </div>
        <Textarea
          label="¿Cuál era la respuesta correcta o qué esperabas? (opcional)"
          placeholder='Ej.: "Publicidad Comercial" es un cliente, quería solo sus compras de este año.'
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          icon={ThumbsDown}
          onClick={() =>
            onSubmit({ reason, comment: comment.trim() || undefined })
          }
        >
          Enviar
        </Button>
      </DialogFooter>
    </>
  );
}
