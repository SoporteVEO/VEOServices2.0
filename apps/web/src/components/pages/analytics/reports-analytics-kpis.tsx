"use client";

import {
  ClipboardCheck,
  ClipboardList,
  Hammer,
  Percent,
  Send,
  TrendingUp,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { NativeCounterUp } from "@/components/ui/counter-up";
import { cn } from "@/lib/utils";

import type { ReportsAnalyticsOverview } from "@/api/analytics/analytics.types";

type Tone = "primary" | "emerald" | "amber" | "rose" | "sky" | "violet";

const TONE_STYLES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

interface KpiItem {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  detail?: string;
  tone?: Tone;
}

const KPI_SKELETON_COUNT = 8;

interface ReportsAnalyticsKpisProps {
  overview?: ReportsAnalyticsOverview;
  isLoading: boolean;
}

export function ReportsAnalyticsKpis({
  overview,
  isLoading,
}: ReportsAnalyticsKpisProps) {
  if (isLoading || !overview) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: KPI_SKELETON_COUNT }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
    );
  }

  const { totals, byType, currentMonthCompliance } = overview;
  const { activeContractsTotal, monthlyReportsSent, pending, coverage } =
    currentMonthCompliance;

  const items: KpiItem[] = [
    {
      icon: Send,
      label: "Reportes enviados",
      value: totals.total,
      detail: `Por ${totals.distinctUsers} usuario${
        totals.distinctUsers === 1 ? "" : "s"
      } en ${totals.distinctContracts} contrato${
        totals.distinctContracts === 1 ? "" : "s"
      }`,
      tone: "primary",
    },
    {
      icon: TrendingUp,
      label: "Promedio diario",
      value: totals.averagePerDay,
      decimals: 2,
      detail: "Reportes por día en el rango",
      tone: "violet",
    },
    {
      icon: ClipboardCheck,
      label: "Mensuales",
      value: byType.monthly.count,
      detail: `${byType.monthly.distinctContracts} contrato${
        byType.monthly.distinctContracts === 1 ? "" : "s"
      } cubierto${byType.monthly.distinctContracts === 1 ? "" : "s"}`,
      tone: "sky",
    },
    {
      icon: Hammer,
      label: "Instalación",
      value: byType.installation.count,
      detail: `${byType.installation.distinctContracts} contrato${
        byType.installation.distinctContracts === 1 ? "" : "s"
      } cubierto${byType.installation.distinctContracts === 1 ? "" : "s"}`,
      tone: "violet",
    },
    {
      icon: Wrench,
      label: "Mantenimiento",
      value: byType.maintenance.count,
      detail: `${byType.maintenance.distinctContracts} contrato${
        byType.maintenance.distinctContracts === 1 ? "" : "s"
      } cubierto${byType.maintenance.distinctContracts === 1 ? "" : "s"}`,
      tone: "amber",
    },
    {
      icon: Percent,
      label: "Cobertura mensual",
      value: coverage,
      suffix: "%",
      decimals: 1,
      detail: `${monthlyReportsSent} de ${activeContractsTotal} contratos activos`,
      tone: coverage >= 80 ? "emerald" : coverage >= 50 ? "amber" : "rose",
    },
    {
      icon: ClipboardList,
      label: "Pendientes mensuales",
      value: pending,
      detail:
        pending === 0
          ? "Todos los contratos al día"
          : `Sumatoria por usuario · en el rango`,
      tone: pending === 0 ? "emerald" : "amber",
    },
    {
      icon: Users,
      label: "Usuarios activos",
      value: totals.distinctUsers,
      detail: `${activeContractsTotal} contratos activos asignados`,
      tone: "primary",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          size="sm"
          className="border-border/80 shadow-none"
        >
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </CardTitle>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  TONE_STYLES[item.tone ?? "primary"],
                )}
              >
                <item.icon className="size-3.5" />
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0.5">
            <NativeCounterUp
              value={item.value}
              prefix={item.prefix}
              suffix={item.suffix}
              decimals={item.decimals ?? 0}
              label={item.label}
              duration={1.4}
              className="text-xl font-semibold tracking-tight"
            />
            {item.detail ? (
              <span className="truncate text-[11px] text-muted-foreground">
                {item.detail}
              </span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
