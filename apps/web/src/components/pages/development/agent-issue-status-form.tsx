"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useUpdateAgentIssue } from "@/api/development/agent-issues.patch";
import type {
  AgentIssue,
  AgentIssueSeverity,
  AgentIssueStatus,
} from "@/api/development/agent-issues.types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ISSUE_SEVERITY_LABELS,
  ISSUE_SEVERITY_ORDER,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_ORDER,
} from "./const";

export function AgentIssueStatusForm({ issue }: { issue: AgentIssue }) {
  const [status, setStatus] = useState(issue.status);
  const [severity, setSeverity] = useState(issue.severity);
  const [notes, setNotes] = useState(issue.resolutionNotes ?? "");
  const update = useUpdateAgentIssue();

  const trimmedNotes = notes.trim();
  const dirty =
    status !== issue.status ||
    severity !== issue.severity ||
    trimmedNotes !== (issue.resolutionNotes ?? "");

  function handleSave() {
    update.mutate(
      {
        id: issue.id,
        input: { status, severity, resolutionNotes: trimmedNotes || null },
      },
      {
        onSuccess: () => toast.success(`Ticket ${issue.ticket} actualizado`),
        onError: (error) =>
          toast.error(error.message || "No se pudo actualizar el ticket"),
      },
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Estado"
          value={status}
          onValueChange={(value) => setStatus(value as AgentIssueStatus)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ISSUE_STATUS_ORDER.map((value) => (
              <SelectItem key={value} value={value}>
                {ISSUE_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          label="Severidad"
          value={severity}
          onValueChange={(value) => setSeverity(value as AgentIssueSeverity)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ISSUE_SEVERITY_ORDER.map((value) => (
              <SelectItem key={value} value={value}>
                {ISSUE_SEVERITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        label="Notas de resolución"
        placeholder="Causa raíz, commit o PR que lo corrige…"
        rows={2}
        maxLength={4000}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />
      <Button
        icon={Save}
        className="self-end"
        disabled={!dirty || update.isPending}
        onClick={handleSave}
      >
        {update.isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}
