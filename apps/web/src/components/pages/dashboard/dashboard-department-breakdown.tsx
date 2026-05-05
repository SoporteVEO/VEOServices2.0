"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

import { formatPercent } from "./dashboard-utils";

import type { DashboardDepartmentBreakdown } from "@/api/billboards/billboards.get";

interface DashboardDepartmentBreakdownProps {
  departments: DashboardDepartmentBreakdown[];
  isLoading: boolean;
}

export function DashboardDepartmentBreakdownCard({
  departments,
  isLoading,
}: DashboardDepartmentBreakdownProps) {
  const sortedByRevenue = useMemo(
    () => [...departments].sort((a, b) => b.estimatedRevenue - a.estimatedRevenue),
    [departments],
  );

  const maxRevenue = sortedByRevenue[0]?.estimatedRevenue ?? 0;

  if (isLoading) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Por departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-sm">Por departamento</CardTitle>
          <CardDescription className="text-xs">
            Inventario, ocupación e ingresos estimados por zona
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sortedByRevenue.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[420px]">
            <ul className="flex flex-col gap-2 pr-3">
              {sortedByRevenue.map((d) => {
                const occupancy =
                  d.totalBillboards > 0
                    ? d.occupiedBillboards / d.totalBillboards
                    : 0;
                const revenueShare =
                  maxRevenue > 0 ? d.estimatedRevenue / maxRevenue : 0;
                return (
                  <li
                    key={`${d.departmentId ?? "x"}-${d.departmentName ?? ""}`}
                    className="flex flex-col gap-2 rounded-md border bg-accent/10 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium">
                          {d.departmentName ?? "Sin departamento"}
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(d.estimatedRevenue)}
                      </span>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70"
                        style={{ width: `${revenueShare * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <DotIndicator
                          color={
                            occupancy >= 0.7
                              ? "bg-emerald-500"
                              : occupancy >= 0.4
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }
                        />
                        Ocupación: {formatPercent(occupancy, 0)}
                      </span>
                      <span>
                        {d.occupiedBillboards}/{d.totalBillboards} vallas
                      </span>
                      <span>
                        {d.contractsCount} contrato
                        {d.contractsCount === 1 ? "" : "s"}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function DotIndicator({ color }: { color: string }) {
  return <span className={cn("size-2 rounded-full", color)} />;
}

function EmptyState() {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
      Sin datos por departamento en el rango
    </div>
  );
}
