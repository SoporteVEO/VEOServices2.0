"use client";

import { useMemo } from "react";
import {
  Building2,
  DollarSign,
  FileText,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  SalesByCostCenterReport,
  SalesByCostCenterRow,
} from "@/api/analytics/analytics.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NativeCounterUp } from "@/components/ui/counter-up";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { cn } from "@/lib/utils";

type Tone =
  | "primary"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "violet"
  | "neutral";

const TONE_ICON_STYLES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  neutral: "bg-muted text-muted-foreground",
};

const BREAKDOWN_BAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-primary",
  "bg-cyan-500",
  "bg-orange-500",
] as const;

function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type Aggregate = {
  key: string;
  label: string;
  total: number;
  count: number;
};

function aggregateBy(
  rows: SalesByCostCenterRow[],
  pick: (row: SalesByCostCenterRow) => {
    key: string | number | null;
    label: string;
  },
): Aggregate[] {
  const map = new Map<string, Aggregate>();
  for (const row of rows) {
    const { key, label } = pick(row);
    const safeKey = String(key ?? "none");
    const existing = map.get(safeKey);
    if (existing) {
      existing.total += row.total;
      existing.count += 1;
    } else {
      map.set(safeKey, {
        key: safeKey,
        label,
        total: row.total,
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

function StatCard({
  title,
  description,
  icon: Icon,
  value,
  prefix,
  suffix,
  decimals = 0,
  tone = "neutral",
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  tone?: Tone;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-md",
              TONE_ICON_STYLES[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <NativeCounterUp
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          label={title}
          duration={1.4}
          className="text-2xl font-semibold tracking-tight"
        />
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({
  title,
  description,
  data,
  total,
}: {
  title: string;
  description: string;
  data: Aggregate[];
  total: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos.</p>
        ) : (
          data.map((item, index) => {
            const pct =
              total !== 0 ? Math.round((item.total / total) * 1000) / 10 : 0;
            const barColor =
              BREAKDOWN_BAR_COLORS[index % BREAKDOWN_BAR_COLORS.length];
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium line-clamp-1">{item.label}</span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded bg-muted">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded transition-[width] duration-500",
                      barColor,
                    )}
                    style={{
                      width: `${Math.max(0, Math.min(100, pct))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {item.count} factura{item.count === 1 ? "" : "s"}
                  </span>
                  <span className="tabular-nums">{pct.toFixed(1)}%</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

export function SalesByCostCenterSummaryCards({
  report,
  isLoading,
}: {
  report: SalesByCostCenterReport | undefined;
  isLoading: boolean;
}) {
  const aggregates = useMemo(() => {
    const rows = report?.rows ?? [];
    const total = report?.total ?? 0;

    const byCostCenter = aggregateBy(rows, (r) => ({
      key: r.costCenterId ?? r.costCenterName,
      label: r.costCenterName,
    }));

    const bySubCenter = aggregateBy(rows, (r) => ({
      key: r.subCostCenterId ?? r.subCostCenterName,
      label: r.subCostCenterName ?? "Sin sub centro",
    }));

    const byTipoVenta = aggregateBy(rows, (r) => ({
      key: r.tipoVentaId ?? r.tipoVentaName,
      label: r.tipoVentaName,
    }));

    const bySeller = aggregateBy(rows, (r) => ({
      key: r.sellerId ?? r.sellerName,
      label: r.sellerName,
    }));

    const uniqueCustomers = new Set(rows.map((r) => r.customerName)).size;
    const uniqueInvoices = new Set(rows.map((r) => r.invoiceId)).size;

    return {
      total,
      byCostCenter,
      bySubCenter,
      byTipoVenta,
      bySeller,
      uniqueCustomers,
      uniqueInvoices,
    };
  }, [report]);

  if (isLoading && !report) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-2 h-8 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalTone: Tone =
    aggregates.total < 0
      ? "rose"
      : aggregates.total > 0
        ? "emerald"
        : "neutral";

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total general"
          description="Suma con IVA e impuestos (incluye NDC)"
          icon={DollarSign}
          value={Math.abs(aggregates.total)}
          prefix={aggregates.total < 0 ? "-$" : "$"}
          decimals={2}
          tone={totalTone}
        />
        <StatCard
          title="Facturas"
          description="Documentos CCF, FCF y NDC"
          icon={FileText}
          value={aggregates.uniqueInvoices}
          tone="violet"
        />
        <StatCard
          title="Clientes únicos"
          description="Clientes con al menos una factura"
          icon={Users}
          value={aggregates.uniqueCustomers}
          tone="sky"
        />
        <StatCard
          title="Vendedores"
          description="Vendedores con ventas en el período"
          icon={Building2}
          value={aggregates.bySeller.length}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BreakdownCard
          title="Por Centro de Costos"
          description="Distribución por centro de costos a nivel de línea"
          data={aggregates.byCostCenter}
          total={aggregates.total}
        />
        <BreakdownCard
          title="Por Sub Centro de Costos"
          description="Distribución por sub centro de costos a nivel de línea"
          data={aggregates.bySubCenter}
          total={aggregates.total}
        />
        <BreakdownCard
          title="Por Tipo de Venta"
          description="Distribución por tipo de venta"
          data={aggregates.byTipoVenta}
          total={aggregates.total}
        />
        <BreakdownCard
          title="Por Vendedor"
          description="Distribución por vendedor"
          data={aggregates.bySeller}
          total={aggregates.total}
        />
      </div>
    </div>
  );
}
