"use client";

import { useMemo } from "react";
import { Building2, DollarSign, FileText, Users } from "lucide-react";
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
import { Skeleton } from "@/components/primitives/ui/skeleton";

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
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
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
          data.map((item) => {
            const pct =
              total !== 0 ? Math.round((item.total / total) * 1000) / 10 : 0;
            return (
              <div key={item.key} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium line-clamp-1">
                    {item.label}
                  </span>
                  <span className="tabular-nums font-medium">
                    {formatCurrency(item.total)}
                  </span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded bg-primary"
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

    const bySubCenter = aggregateBy(rows, (r) => ({
      key: r.subCostCenterId ?? r.subCostCenterName,
      label: r.subCostCenterName ?? "Sin sub centro",
    }));

    const bySeller = aggregateBy(rows, (r) => ({
      key: r.sellerId ?? r.sellerName,
      label: r.sellerName,
    }));

    const uniqueCustomers = new Set(rows.map((r) => r.customerName)).size;

    return { total, bySubCenter, bySeller, uniqueCustomers };
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

  const rows = report?.rows ?? [];

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total general"
          description="Suma neta del período (incluye NDC)"
          icon={DollarSign}
          value={formatCurrency(aggregates.total)}
        />
        <StatCard
          title="Facturas"
          description="Documentos CCF, FCF y NDC"
          icon={FileText}
          value={rows.length.toLocaleString("en-US")}
        />
        <StatCard
          title="Clientes únicos"
          description="Clientes con al menos una factura"
          icon={Users}
          value={aggregates.uniqueCustomers.toLocaleString("en-US")}
        />
        <StatCard
          title="Vendedores"
          description="Vendedores con ventas en el período"
          icon={Building2}
          value={aggregates.bySeller.length.toLocaleString("en-US")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BreakdownCard
          title="Por Sub Centro de Costo"
          description="Distribución por unidad de negocio"
          data={aggregates.bySubCenter}
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
