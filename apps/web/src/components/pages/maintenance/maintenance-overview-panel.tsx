"use client";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Timer,
} from "lucide-react";
import { useMaintenanceOverview } from "@/api/maintenance/maintenance.get";
import { Badge } from "@/components/primitives/ui/badge";
import {
  formatMinutes,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_STYLES,
} from "./maintenance-const";
import { cn } from "@/lib/utils";

/**
 * Module-level analytics. Deliberately a compact summary rather than a full
 * report: the per-job breakdown lives in each order's Historial tab.
 */
export function MaintenanceOverviewPanel() {
  const { data: overview, isLoading } = useMaintenanceOverview({});

  if (isLoading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (!overview) {
    return (
      <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        No pudimos cargar las métricas de mantenimiento.
      </p>
    );
  }

  const { totals, byStatus, byCategory, byTechnician } = overview;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={ClipboardList}
          label="Órdenes"
          value={String(totals.all)}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Fuera de fecha"
          value={String(totals.overdue)}
          tone={totals.overdue > 0 ? "danger" : undefined}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Tasa de cierre"
          value={`${totals.completionRate}%`}
        />
        <KpiCard
          icon={Clock}
          label="Desfase de inicio"
          value={formatMinutes(totals.avgMinutesToStart)}
        />
        <KpiCard
          icon={Timer}
          label="Duración promedio"
          value={formatMinutes(totals.avgMinutesWorked)}
        />
        <KpiCard
          icon={Camera}
          label="Evidencias"
          value={String(totals.photos)}
        />
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h3 className="pb-3 text-sm font-semibold">Por estado</h3>
        <div className="flex flex-col gap-2.5">
          {byStatus.map((entry) => {
            const percent =
              totals.all === 0
                ? 0
                : Math.round((entry.count / totals.all) * 100);
            return (
              <div key={entry.status} className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "w-28 justify-center",
                    MAINTENANCE_STATUS_STYLES[entry.status],
                  )}
                >
                  {MAINTENANCE_STATUS_LABELS[entry.status]}
                </Badge>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs tabular-nums text-muted-foreground">
                  {entry.count} · {percent}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h3 className="pb-3 text-sm font-semibold">Por categoría</h3>
          {byCategory.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos aún.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Categoría</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                  <th className="pb-2 text-right font-medium">Cerradas</th>
                  <th className="pb-2 text-right font-medium">Duración</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((row) => (
                  <tr key={row.categoryId ?? "none"} className="border-t">
                    <td className="py-1.5 pr-2">{row.name}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {row.total}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {row.completed}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatMinutes(row.avgMinutesWorked)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h3 className="pb-3 text-sm font-semibold">Por usuario</h3>
          {byTechnician.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin datos aún.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 text-right font-medium">Asignadas</th>
                  <th className="pb-2 text-right font-medium">Cerradas</th>
                  <th className="pb-2 text-right font-medium">Atrasadas</th>
                  <th className="pb-2 text-right font-medium">Duración</th>
                </tr>
              </thead>
              <tbody>
                {byTechnician.map((row) => (
                  <tr key={row.userId} className="border-t">
                    <td className="py-1.5 pr-2">{row.name}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {row.total}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {row.completed}
                    </td>
                    <td
                      className={cn(
                        "py-1.5 text-right tabular-nums",
                        row.overdue > 0 && "text-red-600 dark:text-red-400",
                      )}
                    >
                      {row.overdue}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatMinutes(row.avgMinutesWorked)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "danger";
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate text-[11px] font-medium">{label}</span>
      </div>
      <p
        className={cn(
          "truncate pt-1 text-xl font-semibold tabular-nums",
          tone === "danger" && "text-red-600 dark:text-red-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}
