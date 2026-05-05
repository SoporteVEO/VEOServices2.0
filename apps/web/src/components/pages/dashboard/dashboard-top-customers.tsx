"use client";

import { Mail, Repeat, Trophy, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Badge } from "@/components/primitives/ui/badge";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { formatMoney, formatHumanDate } from "@/lib/format";

import type { DashboardTopCustomer } from "@/api/billboards/billboards.get";

interface DashboardTopCustomersProps {
  customers: DashboardTopCustomer[];
  isLoading: boolean;
}

export function DashboardTopCustomers({
  customers,
  isLoading,
}: DashboardTopCustomersProps) {
  if (isLoading) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Mejores clientes</CardTitle>
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
            <CardTitle className="text-sm">Mejores clientes</CardTitle>
            <CardDescription className="text-xs">
              Ordenados por ingresos estimados en el rango
            </CardDescription>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
            <Users className="size-3" />
            {customers.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {customers.map((c, idx) => (
              <li
                key={`${c.email ?? c.name}-${idx}`}
                className="flex items-center justify-between gap-3 rounded-md border bg-accent/10 p-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {idx === 0 ? <Trophy className="size-3.5" /> : idx + 1}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">
                      {c.name}
                    </span>
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                      >
                        <Mail className="size-3" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    ) : c.lastContractEnd ? (
                      <span className="truncate text-[11px] text-muted-foreground">
                        Último vence: {formatHumanDate(c.lastContractEnd)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(c.estimatedSpent)}
                  </span>
                  {c.contractsCount > 1 ? (
                    <Badge className="h-4 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent text-[10px]">
                      <Repeat className="size-2.5" />×{c.contractsCount}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      1 contrato
                    </span>
                  )}
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
      Sin clientes en el rango seleccionado
    </div>
  );
}
