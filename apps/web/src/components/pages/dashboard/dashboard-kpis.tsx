"use client";

import {
  Building2,
  CalendarClock,
  CircleCheck,
  DollarSign,
  Gauge,
  type LucideIcon,
  TrendingUp,
  Users,
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
import { formatMoney } from "@/lib/format";

import type { DashboardKpis } from "@/api/billboards/billboards.get";

interface DashboardKpisProps {
  kpis: DashboardKpis | undefined;
  isLoading: boolean;
}

type Tone =
  | "primary"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "neutral";

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

const TONE_STYLES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  neutral: "bg-muted text-muted-foreground",
};

export function DashboardKpisRow({ kpis, isLoading }: DashboardKpisProps) {
  if (isLoading || !kpis) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
    );
  }

  const items: KpiItem[] = [
    {
      icon: DollarSign,
      label: "Ingresos estimados",
      value: kpis.estimatedRevenue,
      prefix: "USD ",
      detail:
        kpis.totalContracts > 0
          ? `Promedio: ${formatMoney(kpis.averageContractValue)}/contrato`
          : "Sin contratos en el rango",
      tone: "emerald",
    },
    {
      icon: Gauge,
      label: "Ocupación",
      value: kpis.occupancyRate * 100,
      suffix: "%",
      decimals: 1,
      detail: `${kpis.occupiedBillboards} ocupadas · ${kpis.availableBillboards} libres`,
      tone:
        kpis.occupancyRate >= 0.7
          ? "emerald"
          : kpis.occupancyRate >= 0.4
            ? "amber"
            : "rose",
    },
    {
      icon: Building2,
      label: "Vallas totales",
      value: kpis.totalBillboards,
      detail: `${kpis.availableBillboards} disponibles ahora`,
      tone: "primary",
    },
    {
      icon: TrendingUp,
      label: "Contratos en rango",
      value: kpis.totalContracts,
      detail: `${kpis.activeContractsToday} activos hoy`,
      tone: "violet",
    },
    {
      icon: Users,
      label: "Clientes únicos",
      value: kpis.uniqueCustomers,
      detail:
        kpis.uniqueCustomers === 0 ? "Sin clientes" : "Compraron en el rango",
      tone: "sky",
    },
    {
      icon: kpis.endingSoon > 0 ? CalendarClock : CircleCheck,
      label: "Por vencer (30 días)",
      value: kpis.endingSoon,
      detail:
        kpis.endingSoon > 0
          ? "Oportunidad de renovación"
          : "Sin vencimientos próximos",
      tone: kpis.endingSoon > 0 ? "amber" : "emerald",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                  TONE_STYLES[item.tone ?? "neutral"],
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
              <span className="text-[11px] text-muted-foreground truncate">
                {item.detail}
              </span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
