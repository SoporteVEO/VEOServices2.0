"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useAgentCapabilities } from "@/api/agent/agent.get";
import { Badge } from "@/components/primitives/ui/badge";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AGENT_GREETING, AGENT_NAME } from "@/lib/agent-brand";
import { NexoAvatar } from "./nexo-avatar";

const SUGGESTIONS: { scope: string; prompt: string }[] = [
  {
    scope: "static_billboards",
    prompt:
      "Genérame el reporte de vallas estáticas disponibles para el mes de noviembre",
  },
  {
    scope: "images",
    prompt: "Dame las últimas 5 imágenes de la valla VE-3035",
  },
  { scope: "erp_sql", prompt: "Dame una tabla con las 55 vallas más vendidas" },
  {
    scope: "development",
    prompt: "Muéstrame los tickets de errores abiertos de Nexo",
  },
  {
    scope: "dashboard",
    prompt: "Grafica la ocupación de vallas de los últimos 6 meses",
  },
  {
    scope: "contracts",
    prompt: "¿Qué contratos vencen este mes? Expórtalos a Excel",
  },
  {
    scope: "contracts",
    prompt: "Genérame el reporte mensual de la valla VS-2077",
  },
  {
    scope: "email",
    prompt:
      "Envíame por correo un Excel con las vallas disponibles en diciembre",
  },
  { scope: "account", prompt: "Nexo, ¿qué puedes hacer por mí según mi rol?" },
];

const MAX_SUGGESTIONS = 4;

export function AgentEmptyState({
  onPick,
}: {
  onPick: (prompt: string) => void;
}) {
  const {
    data: capabilities,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAgentCapabilities();
  const allowed = new Set(capabilities?.scopes.map((scope) => scope.key));
  const suggestions = SUGGESTIONS.filter((s) => allowed.has(s.scope)).slice(
    0,
    MAX_SUGGESTIONS,
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <div className="relative">
        <div className="absolute inset-x-4 bottom-0 h-4 rounded-full bg-primary/25 blur-md" />
        <NexoAvatar
          size={128}
          priority
          className="relative motion-safe:animate-nexo-float drop-shadow-[0_8px_18px_rgba(163,230,53,0.35)]"
        />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{AGENT_GREETING}</p>
        <p className="text-sm text-muted-foreground">
          Puedo consultar datos del sistema y generar reportes, tablas,
          gráficos, Excel y PDF por ti.
        </p>
      </div>
      {capabilities && !capabilities.enabled ? (
        <p className="text-sm text-destructive">
          {AGENT_NAME} no está configurado en este entorno.
        </p>
      ) : null}
      {isLoading ? (
        <div className="flex w-full flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-5 w-16 rounded-full" />
            ))}
          </div>
        </div>
      ) : null}
      {isError ? (
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <p>No pude conectarme con el servidor para cargar tus módulos.</p>
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={isRefetching ? Loader2 : RotateCcw}
            iconClassName={isRefetching ? "animate-spin" : ""}
            disabled={isRefetching}
            onClick={() => void refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : null}
      {suggestions.length > 0 ? (
        <div className="flex w-full flex-col gap-2">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.prompt}
              variant="outline"
              className="h-auto justify-start whitespace-normal py-2 text-left font-normal"
              onClick={() => onPick(suggestion.prompt)}
            >
              {suggestion.prompt}
            </Button>
          ))}
        </div>
      ) : null}
      {capabilities ? (
        <div className="flex flex-wrap justify-center gap-1">
          {capabilities.scopes.map((scope) => (
            <Badge
              key={scope.key}
              variant="secondary"
              className="text-[10px] font-normal"
            >
              {scope.label}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
