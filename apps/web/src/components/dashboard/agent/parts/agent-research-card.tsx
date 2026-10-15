"use client";

import { ExternalLink, Globe } from "lucide-react";
import type { AgentResearchOutput } from "@/api/agent/agent.types";
import { AgentMarkdown } from "../agent-markdown";
import { AgentPartFrame } from "./agent-part-frame";

export function AgentResearchCard({
  research,
}: {
  research: AgentResearchOutput;
}) {
  const sourcesLabel = `${research.sources.length} ${research.sources.length === 1 ? "fuente" : "fuentes"}`;

  return (
    <AgentPartFrame
      icon={Globe}
      title={`Investigación de ${research.company}`}
      description={[research.focus, sourcesLabel].filter(Boolean).join(" · ")}
    >
      <div className="max-h-72 overflow-y-auto px-3 py-2.5">
        <AgentMarkdown text={research.summary} />
      </div>
      {research.sources.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5 border-t px-3 py-2">
          {research.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex max-w-56 items-center gap-1 border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <span className="truncate">{source.title}</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </AgentPartFrame>
  );
}
