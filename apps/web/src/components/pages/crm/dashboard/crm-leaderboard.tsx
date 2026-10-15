"use client";

import { Medal } from "lucide-react";
import type { CrmDashboard } from "@/api/crm/crm.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { personName } from "../crm-format";
import { CrmUserAvatar } from "../shared/crm-user-avatar";
import { EmptyList, ListSkeleton } from "./crm-dashboard-lists";

const MEDAL_COLORS = ["text-amber-500", "text-slate-400", "text-orange-700"];

export function CrmLeaderboard({
  dashboard,
  isLoading,
}: {
  dashboard: CrmDashboard | undefined;
  isLoading: boolean;
}) {
  const rows = dashboard?.leaderboard ?? [];
  const max = Math.max(1, ...rows.map((row) => row.wonValue));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking del equipo</CardTitle>
        <CardDescription>Ventas ganadas en el período</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !dashboard ? (
          <ListSkeleton rows={4} />
        ) : rows.length === 0 ? (
          <EmptyList message="Aún no hay asesores con el sub-rol Ventas." />
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li key={row.user.id} className="flex items-center gap-3">
                <span className="flex w-5 justify-center text-xs font-semibold tabular-nums text-muted-foreground">
                  {index < 3 ? (
                    <Medal className={cn("size-4", MEDAL_COLORS[index])} />
                  ) : (
                    index + 1
                  )}
                </span>
                <CrmUserAvatar user={row.user} size="default" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {personName(row.user)}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMoney(row.wonValue)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(row.wonValue / max) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {row.wonCount} ganados · {row.openCount} abiertos (
                    {formatMoney(row.openValue)})
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
