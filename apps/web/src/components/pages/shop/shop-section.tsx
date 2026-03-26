"use client";

import { useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, TrendingUp } from "lucide-react";
import {
  useAvailableBillboards,
  useBillboardStates,
} from "@/api/billboards/billboards.get";
import {
  useDigitalShopDepartments,
  useShopDigitalBillboards,
} from "@/api/shop/shop.get";
import { toYYYYMMDD, parseYYYYMMDD } from "@/lib/format";
import { parseSpotsSearchParam } from "@/lib/digital-spots";
import { FilterBar, InventoryGrid, CartButton } from "@/components/pages/shop";
import { Skeleton } from "@/components/primitives/ui/skeleton";

function startOfToday() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function ShopSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tipoParam = searchParams.get("tipo");
  const mode = tipoParam === "digital" ? "digital" : ("estatica" as const);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const stateIdParam = searchParams.get("stateId");
  const spotsParam = searchParams.get("spots") ?? undefined;

  const defaultFrom = startOfToday();
  const defaultTo = addDays(defaultFrom, 30);

  const from = useMemo(() => {
    const parsed = parseYYYYMMDD(fromParam);
    return parsed ?? defaultFrom;
  }, [fromParam]);

  const to = useMemo(() => {
    const parsed = parseYYYYMMDD(toParam);
    return parsed ?? defaultTo;
  }, [toParam]);

  const fromStr = toYYYYMMDD(from);
  const toStr = toYYYYMMDD(to);
  const digitalSpots = parseSpotsSearchParam(spotsParam);

  const billboardStatesQuery = useBillboardStates({
    from: fromStr,
    to: toStr,
    enabled: mode === "estatica",
  });

  const digitalDepartmentsQuery = useDigitalShopDepartments({
    enabled: mode === "digital",
  });

  const states =
    mode === "estatica"
      ? (billboardStatesQuery.data ?? [])
      : (digitalDepartmentsQuery.data ?? []);

  const selectedDepartmentId = stateIdParam ? Number(stateIdParam) : null;
  const effectiveDepartmentId =
    selectedDepartmentId ?? (states.length > 0 ? states[0].departmentId : null);

  const staticBillboardsQuery = useAvailableBillboards({
    departmentId: effectiveDepartmentId,
    from: fromStr,
    to: toStr,
    enabled: mode === "estatica",
  });

  const digitalBillboardsQuery = useShopDigitalBillboards({
    departmentId: effectiveDepartmentId,
    from: fromStr,
    to: toStr,
    spots: digitalSpots,
    enabled: mode === "digital",
  });

  const billboardsData =
    mode === "estatica"
      ? staticBillboardsQuery.data
      : digitalBillboardsQuery.data;

  const isPending =
    mode === "estatica"
      ? staticBillboardsQuery.isPending
      : digitalBillboardsQuery.isPending;

  const isFetching =
    mode === "estatica"
      ? staticBillboardsQuery.isFetching
      : digitalBillboardsQuery.isFetching;

  const isRefreshing = isFetching && !isPending;
  const hasData = billboardsData != null;

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
      router.push(`/shop?${params}`);
    },
    [router, buildParams],
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <TrendingUp className="size-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              VEO MARKETPLACE
            </h1>
          </div>
          <CartButton />
        </div>
      </header>

      {/* Hero Section */}
      <div className="w-full bg-muted/30 border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Descubre inventario premium
            </h2>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Explora y reserva vallas estáticas y pantallas digitales para tus
              próximas campañas publicitarias.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        mode={mode}
        from={fromStr}
        to={toStr}
        digitalSpots={digitalSpots}
        states={states}
        effectiveDepartmentId={effectiveDepartmentId}
        onRangeChange={handleRangeChange}
        buildParams={buildParams}
      />

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Resultados de búsqueda
            </h2>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
              <span className="text-sm font-medium text-foreground">
                {billboardsData?.length ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">disponibles</span>
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
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
            className="transition-opacity duration-300 ease-in-out min-h-[400px]"
            style={{ opacity: isRefreshing ? 0.6 : 1 }}
            aria-busy={isRefreshing}
          >
            <InventoryGrid
              mode={mode}
              billboards={billboardsData ?? []}
              from={fromStr}
              to={toStr}
              digitalSpots={digitalSpots}
            />
          </div>
        )}
      </main>
    </div>
  );
}
