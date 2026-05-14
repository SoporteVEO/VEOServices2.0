"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function DashboardError({
  error,
  unstable_retry,
}: DashboardErrorProps) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-base font-semibold">Algo salió mal</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Ocurrió un error inesperado en esta pantalla. Puedes intentar
          recargarla; si el problema persiste, vuelve al inicio del dashboard.
        </p>
        {error.digest ? (
          <p className="pt-1 text-[11px] text-muted-foreground/70">
            Código de error:{" "}
            <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={unstable_retry} icon={RefreshCw}>
          Reintentar
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = "/dashboard";
          }}
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
