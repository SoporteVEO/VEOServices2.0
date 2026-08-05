"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";
import {
  useAvailableBillboards,
  useBillboardStates,
} from "@/api/billboards/billboards.get";
import { toYYYYMMDD, parseYYYYMMDD } from "@/lib/format";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { VallasFilterBar } from "./vallas-filter-bar";
import { VallasGrid } from "./vallas-grid";

function currentMonthRange() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: today, to: endOfMonth };
}

export function VallasPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const stateIdParam = searchParams.get("stateId");

  const defaults = useMemo(() => currentMonthRange(), []);

  const from = useMemo(() => {
    const parsed = parseYYYYMMDD(fromParam);
    return parsed ?? defaults.from;
  }, [fromParam, defaults.from]);

  const to = useMemo(() => {
    const parsed = parseYYYYMMDD(toParam);
    return parsed ?? defaults.to;
  }, [toParam, defaults.to]);

  const fromStr = toYYYYMMDD(from);
  const toStr = toYYYYMMDD(to);

  const statesQuery = useBillboardStates({ from: fromStr, to: toStr });
  const states = statesQuery.data ?? [];

  const selectedDepartmentId = stateIdParam ? Number(stateIdParam) : null;
  const effectiveDepartmentId =
    selectedDepartmentId ?? (states.length > 0 ? states[0].departmentId : null);

  const billboardsQuery = useAvailableBillboards({
    departmentId: effectiveDepartmentId,
    from: fromStr,
    to: toStr,
  });

  const billboards = billboardsQuery.data ?? [];
  const isPending = billboardsQuery.isPending;
  const isFetching = billboardsQuery.isFetching;
  const isRefreshing = isFetching && !isPending;
  const hasData = billboardsQuery.data != null;

  const buildParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("from")) params.set("from", fromStr);
    if (!params.has("to")) params.set("to", toStr);
    return params;
  }, [searchParams, fromStr, toStr]);

  const handleRangeChange = useCallback(
    (newFrom: string, newTo: string) => {
      const params = buildParams();
      params.set("from", newFrom);
      params.set("to", newTo);
      router.push(`/vallas?${params}`);
    },
    [router, buildParams],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Megaphone className="size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">VEO VALLAS</h1>
          </div>
        </div>
      </header>

      <div className="w-full border-b border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Vallas estáticas disponibles
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Explora nuestro inventario de vallas estáticas y consulta la
              disponibilidad para las fechas que necesitas. Contáctanos por
              WhatsApp para reservar la que más te interese.
            </p>
          </div>
        </div>
      </div>

      <VallasFilterBar
        from={fromStr}
        to={toStr}
        states={states}
        effectiveDepartmentId={effectiveDepartmentId}
        onRangeChange={handleRangeChange}
        buildParams={buildParams}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Vallas disponibles
            </h2>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
              <span className="text-sm font-medium text-foreground">
                {billboards.length}
              </span>
              <span className="text-sm text-muted-foreground">encontradas</span>
            </div>
          </div>

          {isRefreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Actualizando...</span>
            </div>
          )}
        </div>

        {isPending && !hasData ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="min-h-[400px] transition-opacity duration-300 ease-in-out"
            style={{ opacity: isRefreshing ? 0.6 : 1 }}
            aria-busy={isRefreshing}
          >
            <VallasGrid billboards={billboards} />
          </div>
        )}
      </main>

      <footer className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            ¿Tienes preguntas? Escríbenos por WhatsApp al{" "}
            <a
              href="https://wa.me/50378099688"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              +503 7809 9688
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
