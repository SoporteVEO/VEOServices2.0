"use client";

import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useUpdateAgentLearning } from "@/api/development/agent-learnings.mutations";
import type { AgentLearningStatus } from "@/api/development/agent-learnings.types";
import { Button } from "@/components/ui/button";

export function AgentLearningActions({
  id,
  status,
}: {
  id: string;
  status: AgentLearningStatus;
}) {
  const update = useUpdateAgentLearning();

  function setStatus(next: AgentLearningStatus, message: string) {
    update.mutate(
      { id, input: { status: next } },
      {
        onSuccess: () => toast.success(message),
        onError: (error) =>
          toast.error(error.message || "No se pudo actualizar"),
      },
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      onClick={(event) => event.stopPropagation()}
    >
      {status !== "ACTIVE" ? (
        <Button
          variant="outline"
          sizeVariant="sm"
          icon={Check}
          disabled={update.isPending}
          onClick={() => setStatus("ACTIVE", "Aprendizaje activado")}
        >
          Aprobar
        </Button>
      ) : null}
      {status !== "REJECTED" ? (
        <Button
          variant="ghost"
          sizeVariant="sm"
          icon={X}
          disabled={update.isPending}
          onClick={() => setStatus("REJECTED", "Aprendizaje rechazado")}
        >
          {status === "ACTIVE" ? "Desactivar" : "Rechazar"}
        </Button>
      ) : null}
    </div>
  );
}
