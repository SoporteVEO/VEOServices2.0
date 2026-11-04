"use client";

import Image from "next/image";
import { CircleAlert, CircleCheck, Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { useAgentCapabilities } from "@/api/agent/agent.get";
import { useExpansionNexoInsight } from "@/api/expansion/expansion.mutations";
import type { ExpansionNexoInsightInput } from "@/api/expansion/expansion.types";
import { NEXO_ACCENT_CLASS } from "@/components/dashboard/agent/ask-nexo-button";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AGENT_AVATAR_SRC, AGENT_NAME } from "@/lib/agent-brand";
import { cn } from "@/lib/utils";
import { VerdictBadge } from "../expansion-badges";

const TIME_FORMAT = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });

/** Asks Nexo for a written opinion; only on demand, since every call spends model tokens. */
export function ExpansionNexoInsight({
  request,
  waiting = false,
  className,
}: {
  request: ExpansionNexoInsightInput;
  /** True while the score is still missing inputs (e.g. surroundings loading). */
  waiting?: boolean;
  className?: string;
}) {
  const { data: capabilities } = useAgentCapabilities();
  const insight = useExpansionNexoInsight();

  if (capabilities && !capabilities.enabled) return null;

  const result = insight.data;
  const ask = () => insight.mutate(request);

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-veo-lime/60 bg-veo-lime-soft/20 p-3 dark:bg-veo-lime/5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Image
          src={AGENT_AVATAR_SRC}
          alt={AGENT_NAME}
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-full"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold">Opinión de {AGENT_NAME}</span>
          <span className="text-[11px] text-muted-foreground">
            Tráfico, densidad, competencia propia y rentabilidad de la zona
          </span>
        </div>
        {result ? <VerdictBadge verdict={result.verdict} /> : null}
      </div>

      {insight.isPending ? (
        <div className="flex flex-col gap-2" role="status" aria-label="Analizando">
          <p className="text-xs text-muted-foreground">{AGENT_NAME} está evaluando la ubicación...</p>
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ) : result ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">{result.headline}</p>
            <p className="text-sm text-foreground/85">{result.summary}</p>
          </div>
          <InsightList items={result.strengths} icon={CircleCheck} className="text-success" />
          <InsightList items={result.risks} icon={CircleAlert} className="text-destructive" />
          <InsightList items={result.suggestions} icon={Lightbulb} className="text-warning" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              {TIME_FORMAT.format(new Date(result.generatedAt))}
              {result.usedSurroundings ? " · con datos de OpenStreetMap" : " · sin datos del entorno"}
            </span>
            <Button variant="ghost" sizeVariant="sm" icon={RefreshCw} onClick={ask}>
              Volver a analizar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {insight.isError ? (
            <p className="text-xs text-destructive">
              {insight.error instanceof Error
                ? insight.error.message
                : `${AGENT_NAME} no pudo analizar la ubicación.`}
            </p>
          ) : null}
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={Sparkles}
            iconClassName="text-veo-gray dark:text-veo-lime"
            className={cn("self-start", NEXO_ACCENT_CLASS)}
            disabled={waiting}
            onClick={ask}
          >
            {waiting
              ? "Analizando entorno..."
              : insight.isError
                ? "Reintentar"
                : `Pedir opinión a ${AGENT_NAME}`}
          </Button>
        </div>
      )}
    </section>
  );
}

function InsightList({
  items,
  icon: Icon,
  className,
}: {
  items: string[];
  icon: typeof CircleCheck;
  className: string;
}) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 text-sm">
          <Icon className={cn("mt-0.5 size-4 shrink-0", className)} />
          {item}
        </li>
      ))}
    </ul>
  );
}
