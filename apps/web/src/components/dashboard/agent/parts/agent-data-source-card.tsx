"use client";

import { CircleCheck, Database, Server } from "lucide-react";
import type { AgentDataSource } from "@/api/agent/agent.types";
import { Button } from "@/components/ui/button";
import { useAgentChatActions } from "../agent-chat-context";
import { AgentPartFrame } from "./agent-part-frame";

const SOURCES: {
  value: AgentDataSource;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "VEO", label: "VEO Services", icon: Server },
  { value: "BRILO", label: "Brilo (ERP)", icon: Database },
];

interface AgentDataSourceCardProps {
  toolCallId: string;
  topic?: string;
  state: string;
  chosen?: AgentDataSource;
}

export function AgentDataSourceCard({
  toolCallId,
  topic,
  state,
  chosen,
}: AgentDataSourceCardProps) {
  const { chooseDataSource, isBusy } = useAgentChatActions();
  const subject = topic
    ? `¿De dónde quieres obtener ${topic}?`
    : "¿De dónde quieres obtener la información?";

  if (state === "output-available" && chosen) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CircleCheck className="size-3.5 text-emerald-600" />
        Fuente: {SOURCES.find((s) => s.value === chosen)?.label ?? chosen}
      </p>
    );
  }

  return (
    <AgentPartFrame
      icon={Database}
      title={subject}
      description="Esta información existe tanto en la plataforma como en el ERP."
    >
      <div className="flex flex-wrap gap-2 px-3 py-2.5">
        {SOURCES.map((source) => (
          <Button
            key={source.value}
            variant="outline"
            sizeVariant="sm"
            icon={source.icon}
            disabled={isBusy || state !== "input-available"}
            onClick={() => chooseDataSource(toolCallId, source.value)}
          >
            {source.label}
          </Button>
        ))}
      </div>
    </AgentPartFrame>
  );
}
