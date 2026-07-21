"use client";

import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  type LucideIcon,
  Wallet,
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

import type {
  MyContractsSnapshot,
  MyReportsTrend,
} from "@/api/contracts/contracts.get";
import type { MyOffersSummary } from "@/api/offers/offers.types";

type Tone = "primary" | "emerald" | "amber" | "rose" | "sky" | "violet";

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
};

interface MySpaceKpisProps {
  offers?: MyOffersSummary;
  contracts?: MyContractsSnapshot;
  reports?: MyReportsTrend;
  isLoading: boolean;
}

export function MySpaceKpisRow({
  offers,
  contracts,
  reports,
  isLoading,
}: MySpaceKpisProps) {
  if (isLoading || !offers || !contracts || !reports) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full" />
        ))}
      </div>
    );
  }

  const acceptedAmount =
    offers.byStatus.accepted.totalRental +
    offers.byStatus.accepted.totalImpression;
  const pendingAmount =
    offers.byStatus.pending.totalRental +
    offers.byStatus.pending.totalImpression;

  const items: KpiItem[] = [
    {
      icon: ClipboardList,
      label: "Contratos activos",
      value: contracts.activeCount,
      detail:
        contracts.activeCount === 0
          ? "Sin contratos activos"
          : "Asignados a tu nombre",
      tone: "primary",
    },
    {
      icon: CheckCircle2,
      label: "Reportes enviados",
      value: contracts.reportsSentThisMonth,
      detail: `En el rango · de ${contracts.activeCount} contrato${
        contracts.activeCount === 1 ? "" : "s"
      }`,
      tone: "emerald",
    },
    {
      icon: AlertCircle,
      label: "Reportes pendientes",
      value: contracts.reportsPendingThisMonth,
      detail:
        contracts.reportsPendingThisMonth > 0
          ? "Por enviar en el rango"
          : "Todos al día",
      tone: contracts.reportsPendingThisMonth > 0 ? "amber" : "emerald",
    },
    {
      icon: FileText,
      label: "Cotizaciones creadas",
      value: offers.totals.count,
      detail: `Aceptadas: ${offers.byStatus.accepted.count} · Pendientes: ${offers.byStatus.pending.count}`,
      tone: "violet",
    },
    {
      icon: Wallet,
      label: "Ventas (aceptadas)",
      value: acceptedAmount,
      prefix: "USD ",
      detail:
        offers.byStatus.accepted.count === 0
          ? "Sin cotizaciones aceptadas"
          : `${offers.byStatus.accepted.count} cotización${
              offers.byStatus.accepted.count === 1 ? "" : "es"
            } aceptada${offers.byStatus.accepted.count === 1 ? "" : "s"}`,
      tone: "sky",
    },
    {
      icon: Clock,
      label: "Monto pendiente",
      value: pendingAmount,
      prefix: "USD ",
      detail:
        offers.byStatus.pending.count === 0
          ? "Sin cotizaciones pendientes"
          : `${offers.byStatus.pending.count} cotización${
              offers.byStatus.pending.count === 1 ? "" : "es"
            } esperando respuesta`,
      tone: pendingAmount > 0 ? "amber" : "primary",
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

