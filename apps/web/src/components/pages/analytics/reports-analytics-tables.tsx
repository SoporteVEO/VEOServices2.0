"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

import type {
  ReportsAnalyticsByUserRow,
  ReportsAnalyticsCoverageRow,
  ReportsAnalyticsOverview,
} from "@/api/analytics/analytics.types";

function userFullName(row: { firstName: string; lastName: string | null; email: string }) {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  return name || row.email;
}

interface ReportsAnalyticsTablesProps {
  overview?: ReportsAnalyticsOverview;
  isLoading: boolean;
}

export function ReportsAnalyticsTables({
  overview,
  isLoading,
}: ReportsAnalyticsTablesProps) {
  const monthKey = overview?.currentMonthCompliance.monthKey ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalle por usuario</CardTitle>
        <CardDescription>
          Resúmenes por usuario en el rango y compliance del mes en curso
          {monthKey ? ` (${monthKey})` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="totals">
          <TabsList>
            <TabsTrigger value="totals">Reportes en el rango</TabsTrigger>
            <TabsTrigger value="compliance">
              Cumplimiento del mes actual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totals">
            <ByUserTable
              rows={overview?.byUser ?? []}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceTable
              rows={overview?.currentMonthCompliance.perUser ?? []}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ByUserTable({
  rows,
  isLoading,
}: {
  rows: ReportsAnalyticsByUserRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<ReportsAnalyticsByUserRow>[]>(
    () => [
      {
        id: "user",
        header: "Usuario",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{userFullName(row.original)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "totalReports",
        header: "Total",
        cell: ({ row }) => (
          <span className="tabular-nums font-semibold">
            {row.original.totalReports}
          </span>
        ),
      },
      {
        accessorKey: "monthlyCount",
        header: "Mensuales",
        cell: ({ row }) => (
          <span className="tabular-nums text-sky-600 dark:text-sky-400">
            {row.original.monthlyCount}
          </span>
        ),
      },
      {
        accessorKey: "installationCount",
        header: "Instalación",
        cell: ({ row }) => (
          <span className="tabular-nums text-violet-600 dark:text-violet-400">
            {row.original.installationCount}
          </span>
        ),
      },
      {
        accessorKey: "maintenanceCount",
        header: "Mantenimiento",
        cell: ({ row }) => (
          <span className="tabular-nums text-amber-600 dark:text-amber-400">
            {row.original.maintenanceCount}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      pagination={{ pageSize: 25 }}
      emptyMessage="No hay reportes enviados en el rango."
    />
  );
}

function ComplianceTable({
  rows,
  isLoading,
}: {
  rows: ReportsAnalyticsCoverageRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<ReportsAnalyticsCoverageRow>[]>(
    () => [
      {
        id: "user",
        header: "Usuario",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{userFullName(row.original)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "activeContracts",
        header: "Contratos activos",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.activeContracts}</span>
        ),
      },
      {
        accessorKey: "monthlyReportsSent",
        header: "Reportes enviados",
        cell: ({ row }) => (
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
            {row.original.monthlyReportsSent}
          </span>
        ),
      },
      {
        accessorKey: "pending",
        header: "Pendientes",
        cell: ({ row }) => (
          <span
            className={cn(
              "tabular-nums",
              row.original.pending > 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-muted-foreground",
            )}
          >
            {row.original.pending}
          </span>
        ),
      },
      {
        accessorKey: "coverage",
        header: "Cobertura",
        cell: ({ row }) => <CoverageBar value={row.original.coverage} />,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      pagination={{ pageSize: 25 }}
      emptyMessage="No hay usuarios con contratos activos asignados este mes."
    />
  );
}

function CoverageBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone =
    clamped >= 80
      ? "bg-emerald-500"
      : clamped >= 50
        ? "bg-amber-500"
        : "bg-rose-500";
  return (
    <div className="flex min-w-[140px] items-center gap-2">
      <div className="relative h-1.5 flex-1 overflow-hidden rounded bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded transition-[width] duration-500",
            tone,
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="tabular-nums text-xs font-medium text-muted-foreground">
        {clamped.toFixed(1)}%
      </span>
    </div>
  );
}
