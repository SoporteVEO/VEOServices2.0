"use client";

import { Building2, MapPin, Trophy } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Badge } from "@/components/primitives/ui/badge";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { formatMoney } from "@/lib/format";

import type { DashboardTopBillboard } from "@/api/billboards/billboards.get";

interface DashboardTopBillboardsProps {
  billboards: DashboardTopBillboard[];
  isLoading: boolean;
}

export function DashboardTopBillboards({
  billboards,
  isLoading,
}: DashboardTopBillboardsProps) {
  if (isLoading) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Vallas más rentables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Vallas más rentables</CardTitle>
            <CardDescription className="text-xs">
              Top {billboards.length} por ingresos estimados en el rango
            </CardDescription>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            <Building2 className="size-3" />
            {billboards.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {billboards.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {billboards.map((b, idx) => (
              <li
                key={b.billboardId}
                className="flex items-center justify-between gap-3 rounded-md border bg-accent/10 p-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {idx === 0 ? <Trophy className="size-3.5" /> : idx + 1}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {b.billboardCode ?? `#${b.billboardId}`}
                    </span>
                    {(b.cityName ?? b.departmentName ?? b.address) ? (
                      <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <MapPin className="size-3" />
                        <span className="truncate">
                          {[b.cityName, b.departmentName]
                            .filter(Boolean)
                            .join(", ") ||
                            b.address ||
                            "—"}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(b.estimatedRevenue)}
                  </span>
                  <div className="flex items-center gap-1">
                    {b.contractsCount > 0 ? (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[10px] font-normal"
                      >
                        {b.contractsCount} contrato
                        {b.contractsCount === 1 ? "" : "s"}
                      </Badge>
                    ) : null}
                    {b.occupiedDays > 0 ? (
                      <span className="text-[11px] text-muted-foreground">
                        {b.occupiedDays} días
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
      Sin vallas con contratos en el rango seleccionado
    </div>
  );
}
