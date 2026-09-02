"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import type {
  PrintingAnalyticsCustomerRow,
  PrintingAnalyticsMachineRow,
  PrintingAnalyticsOrderRow,
  PrintingAnalyticsOverview,
  PrintingAnalyticsSizeRow,
} from "@/api/analytics/analytics.types";

const PAGE_SIZE = 25;

function hours(value: number): string {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })} h`;
}

function minutes(value: number): string {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 0 })} min`;
}

function percent(value: number): string {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })}%`;
}

function squareMeters(value: number): string {
  return `${value.toLocaleString("es-ES", { maximumFractionDigits: 1 })} m²`;
}

/** Green when the figure is healthy, amber otherwise. */
function RateCell({ value, goal }: { value: number; goal: number }) {
  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        value >= goal ? "text-emerald-600" : "text-amber-600",
      )}
    >
      {percent(value)}
    </span>
  );
}

const MACHINE_COLUMNS: ColumnDef<PrintingAnalyticsMachineRow>[] = [
  {
    accessorKey: "machineName",
    header: "Máquina",
    cell: ({ row }) => (
      <span
        className={cn(
          "font-medium",
          !row.original.isActive && "text-muted-foreground line-through",
        )}
      >
        {row.original.machineName}
      </span>
    ),
  },
  { accessorKey: "jobs", header: "Trabajos" },
  { accessorKey: "completed", header: "Finalizados" },
  { accessorKey: "cancelled", header: "Cancelados" },
  {
    accessorKey: "utilization",
    header: "Uso",
    cell: ({ row }) => <RateCell value={row.original.utilization} goal={50} />,
  },
  {
    accessorKey: "actualPrintHours",
    header: "Horas impresión",
    cell: ({ row }) => hours(row.original.actualPrintHours),
  },
  {
    accessorKey: "actualSetupHours",
    header: "Horas set up",
    cell: ({ row }) => hours(row.original.actualSetupHours),
  },
  {
    accessorKey: "actualCooldownHours",
    header: "Horas cooldown",
    cell: ({ row }) => hours(row.original.actualCooldownHours),
  },
  {
    accessorKey: "avgPrintMinutes",
    header: "Impresión media",
    cell: ({ row }) => minutes(row.original.avgPrintMinutes),
  },
  {
    accessorKey: "avgStartDelayMinutes",
    header: "Desviación inicio",
    cell: ({ row }) => minutes(row.original.avgStartDelayMinutes),
  },
  {
    accessorKey: "onTimeStartRate",
    header: "Puntualidad",
    cell: ({ row }) => (
      <RateCell value={row.original.onTimeStartRate} goal={80} />
    ),
  },
  {
    accessorKey: "planAccuracy",
    header: "Precisión plan",
    cell: ({ row }) => <RateCell value={row.original.planAccuracy} goal={90} />,
  },
  {
    accessorKey: "squareMeters",
    header: "m² impresos",
    cell: ({ row }) => squareMeters(row.original.squareMeters),
  },
];

const SIZE_COLUMNS: ColumnDef<PrintingAnalyticsSizeRow>[] = [
  {
    accessorKey: "sizeKey",
    header: "Medida",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.sizeKey} m</span>
    ),
  },
  { accessorKey: "jobs", header: "Trabajos" },
  { accessorKey: "completed", header: "Finalizados" },
  {
    accessorKey: "avgPlannedPrintMinutes",
    header: "Plan medio",
    cell: ({ row }) => minutes(row.original.avgPlannedPrintMinutes),
  },
  {
    accessorKey: "avgActualPrintMinutes",
    header: "Real medio",
    cell: ({ row }) => minutes(row.original.avgActualPrintMinutes),
  },
  {
    accessorKey: "totalPrintHours",
    header: "Horas impresión",
    cell: ({ row }) => hours(row.original.totalPrintHours),
  },
  {
    accessorKey: "squareMeters",
    header: "m² impresos",
    cell: ({ row }) => squareMeters(row.original.squareMeters),
  },
];

const ORDER_COLUMNS: ColumnDef<PrintingAnalyticsOrderRow>[] = [
  {
    accessorKey: "offerNumber",
    header: "Cotización",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.offerNumber}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) =>
      row.original.customerCompany ?? row.original.customerName,
  },
  { accessorKey: "jobs", header: "Vallas" },
  { accessorKey: "completed", header: "Finalizadas" },
  {
    accessorKey: "plannedHours",
    header: "Horas planificadas",
    cell: ({ row }) => hours(row.original.plannedHours),
  },
  {
    accessorKey: "actualHours",
    header: "Horas reales",
    cell: ({ row }) => hours(row.original.actualHours),
  },
  {
    accessorKey: "squareMeters",
    header: "m² impresos",
    cell: ({ row }) => squareMeters(row.original.squareMeters),
  },
];

const CUSTOMER_COLUMNS: ColumnDef<PrintingAnalyticsCustomerRow>[] = [
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.customerCompany ?? row.original.customerName}
      </span>
    ),
  },
  { accessorKey: "jobs", header: "Trabajos" },
  {
    accessorKey: "actualHours",
    header: "Horas de máquina",
    cell: ({ row }) => hours(row.original.actualHours),
  },
  {
    accessorKey: "squareMeters",
    header: "m² impresos",
    cell: ({ row }) => squareMeters(row.original.squareMeters),
  },
];

interface Props {
  overview?: PrintingAnalyticsOverview;
  isLoading: boolean;
}

export function PrintingAnalyticsTables({ overview, isLoading }: Props) {
  const [tab, setTab] = useState<
    "machines" | "sizes" | "orders" | "customers"
  >("machines");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalle</CardTitle>
        <CardDescription>
          Rendimiento por máquina, medida de valla, orden y cliente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
          <TabsList>
            <TabsTrigger value="machines">Por máquina</TabsTrigger>
            <TabsTrigger value="sizes">Por medida</TabsTrigger>
            <TabsTrigger value="orders">Por orden</TabsTrigger>
            <TabsTrigger value="customers">Por cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="machines">
            <DataTable
              columns={MACHINE_COLUMNS}
              data={overview?.byMachine ?? []}
              isLoading={isLoading}
              pagination={{ pageSize: PAGE_SIZE }}
              emptyMessage="No hay máquinas configuradas."
            />
          </TabsContent>

          <TabsContent value="sizes">
            <DataTable
              columns={SIZE_COLUMNS}
              data={overview?.bySize ?? []}
              isLoading={isLoading}
              pagination={{ pageSize: PAGE_SIZE }}
              emptyMessage="Sin trabajos en el rango."
            />
          </TabsContent>

          <TabsContent value="orders">
            <DataTable
              columns={ORDER_COLUMNS}
              data={overview?.topOrders ?? []}
              isLoading={isLoading}
              pagination={{ pageSize: PAGE_SIZE }}
              emptyMessage="Sin órdenes en el rango."
            />
          </TabsContent>

          <TabsContent value="customers">
            <DataTable
              columns={CUSTOMER_COLUMNS}
              data={overview?.topCustomers ?? []}
              isLoading={isLoading}
              pagination={{ pageSize: PAGE_SIZE }}
              emptyMessage="Sin clientes en el rango."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
