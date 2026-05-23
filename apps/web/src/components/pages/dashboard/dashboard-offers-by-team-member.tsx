"use client";

import { FileText, Trophy, UserCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { formatMoney } from "@/lib/format";

import type { DashboardOffersByTeamMember } from "@/api/billboards/billboards.get";

interface DashboardOffersByTeamMemberProps {
  offers: DashboardOffersByTeamMember[];
  isLoading: boolean;
}

export function DashboardOffersByTeamMemberCard({
  offers,
  isLoading,
}: DashboardOffersByTeamMemberProps) {
  if (isLoading) {
    return (
      <Card size="sm" className="border-border/80 shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Cotizaciones por asesor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalOffers = offers.reduce((sum, o) => sum + o.offerCount, 0);
  const maxOffers = offers.reduce(
    (max, o) => (o.offerCount > max ? o.offerCount : max),
    0,
  );

  return (
    <Card size="sm" className="border-border/80 shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <CardTitle className="text-sm">Cotizaciones por asesor</CardTitle>
            <CardDescription className="text-xs">
              Ordenados por cantidad de cotizaciones generadas
            </CardDescription>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
            <FileText className="size-3" />
            {totalOffers}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-2">
            {offers.map((o, idx) => {
              const widthPct =
                maxOffers > 0
                  ? Math.max(4, Math.round((o.offerCount / maxOffers) * 100))
                  : 0;
              return (
                <li
                  key={o.userId}
                  className="flex flex-col gap-1.5 rounded-md border bg-accent/10 p-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {idx === 0 ? (
                          <Trophy className="size-3.5" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">
                          {o.fullName}
                        </span>
                        {o.position ? (
                          <span className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                            <UserCheck className="size-3" />
                            <span className="truncate">{o.position}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-sm font-semibold tabular-nums">
                        {o.offerCount}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {o.offerCount === 1 ? "cotización" : "cotizaciones"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="relative h-1.5 w-full overflow-hidden rounded bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-violet-500 transition-[width] duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                      <span>Renta: {formatMoney(o.totalRentalAmount)}</span>
                      <span>
                        Impresión: {formatMoney(o.totalImpressionAmount)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
      Sin cotizaciones generadas en el rango seleccionado
    </div>
  );
}
