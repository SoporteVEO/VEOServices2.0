"use client";

import { useMemo, useState } from "react";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOffersAnalyticsList } from "@/api/analytics/analytics.get";
import type {
  OffersAnalyticsByUserRow,
  OffersAnalyticsListItem,
  OffersAnalyticsOverview,
  OffersAnalyticsTopBillboardRow,
  OffersAnalyticsTopCustomerRow,
} from "@/api/analytics/analytics.types";
import { formatMoney, formatShortDate } from "@/lib/format";
import { MyOfferStatusBadge } from "@/components/pages/my-space/my-offer-status-badge";

const PER_USER_PAGE_SIZE = 25;
const TOP_BILLBOARDS_PAGE_SIZE = 25;
const TOP_CUSTOMERS_PAGE_SIZE = 25;
const ALL_OFFERS_DEFAULT_PAGE_SIZE = 25;

function userFullName(row: OffersAnalyticsByUserRow): string {
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  return name || row.email;
}

function listItemFullName(row: OffersAnalyticsListItem): string {
  const name = [row.createdBy.firstName, row.createdBy.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || row.createdBy.email;
}

function billboardLabel(row: OffersAnalyticsTopBillboardRow): string {
  if (row.billboardCode && row.address) {
    return `${row.billboardCode} – ${row.address}`;
  }
  return row.billboardCode ?? row.address ?? row.groupKey ?? "—";
}

function locationLabel(row: OffersAnalyticsTopBillboardRow): string {
  return [row.cityName, row.departmentName].filter(Boolean).join(", ") || "—";
}

interface OffersAnalyticsTablesProps {
  overview?: OffersAnalyticsOverview;
  isLoading: boolean;
  from: string;
  to: string;
  userId: string | null;
  rangeReady: boolean;
}

export function OffersAnalyticsTables({
  overview,
  isLoading,
  from,
  to,
  userId,
  rangeReady,
}: OffersAnalyticsTablesProps) {
  const [tab, setTab] = useState<"users" | "items" | "customers" | "list">(
    "users",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detalle</CardTitle>
        <CardDescription>
          Explora los datos por usuario, vallas, clientes y cotizaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as typeof tab)}
        >
          <TabsList>
            <TabsTrigger value="users">Por usuario</TabsTrigger>
            <TabsTrigger value="items">Vallas más cotizadas</TabsTrigger>
            <TabsTrigger value="customers">Top clientes</TabsTrigger>
            <TabsTrigger value="list">Todas las cotizaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <PerUserTable rows={overview?.byUser ?? []} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="items">
            <TopBillboardsTable
              rows={overview?.topBillboards ?? []}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="customers">
            <TopCustomersTable
              rows={overview?.topCustomers ?? []}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="list">
            <OffersListTable
              from={from}
              to={to}
              userId={userId}
              enabled={rangeReady && tab === "list"}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function PerUserTable({
  rows,
  isLoading,
}: {
  rows: OffersAnalyticsByUserRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<OffersAnalyticsByUserRow>[]>(
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
        accessorKey: "totalOffers",
        header: "Cotizaciones",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.totalOffers}</span>
        ),
      },
      {
        accessorKey: "acceptedCount",
        header: "Aceptadas",
        cell: ({ row }) => (
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
            {row.original.acceptedCount}
          </span>
        ),
      },
      {
        accessorKey: "pendingCount",
        header: "Pendientes",
        cell: ({ row }) => (
          <span className="tabular-nums text-amber-600 dark:text-amber-400">
            {row.original.pendingCount}
          </span>
        ),
      },
      {
        accessorKey: "declinedCount",
        header: "Rechazadas",
        cell: ({ row }) => (
          <span className="tabular-nums text-rose-600 dark:text-rose-400">
            {row.original.declinedCount}
          </span>
        ),
      },
      {
        accessorKey: "acceptedAmount",
        header: "Monto aceptado",
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            {formatMoney(row.original.acceptedAmount)}
          </span>
        ),
      },
      {
        accessorKey: "pendingAmount",
        header: "Monto pendiente",
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.pendingAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Monto total",
        cell: ({ row }) => (
          <span className="tabular-nums font-semibold">
            {formatMoney(row.original.totalAmount)}
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
      pagination={{ pageSize: PER_USER_PAGE_SIZE }}
      emptyMessage="No hay cotizaciones en el rango."
    />
  );
}

function TopBillboardsTable({
  rows,
  isLoading,
}: {
  rows: OffersAnalyticsTopBillboardRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<OffersAnalyticsTopBillboardRow>[]>(
    () => [
      {
        id: "billboard",
        header: "Valla",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {billboardLabel(row.original)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {locationLabel(row.original)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "occurrences",
        header: "Apariciones",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.occurrences}</span>
        ),
      },
      {
        accessorKey: "totalQuantity",
        header: "Cantidad total",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.totalQuantity}</span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Monto cotizado",
        cell: ({ row }) => (
          <span className="tabular-nums font-semibold">
            {formatMoney(row.original.totalAmount)}
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
      pagination={{ pageSize: TOP_BILLBOARDS_PAGE_SIZE }}
      emptyMessage="No hay vallas cotizadas en el rango."
    />
  );
}

function TopCustomersTable({
  rows,
  isLoading,
}: {
  rows: OffersAnalyticsTopCustomerRow[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<OffersAnalyticsTopCustomerRow>[]>(
    () => [
      {
        id: "customer",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.customerName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.customerCompany ?? row.original.customerEmail ?? "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "totalOffers",
        header: "Cotizaciones",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.totalOffers}</span>
        ),
      },
      {
        accessorKey: "acceptedAmount",
        header: "Aceptado",
        cell: ({ row }) => (
          <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(row.original.acceptedAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total cotizado",
        cell: ({ row }) => (
          <span className="tabular-nums font-semibold">
            {formatMoney(row.original.totalAmount)}
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
      pagination={{ pageSize: TOP_CUSTOMERS_PAGE_SIZE }}
      emptyMessage="No hay clientes en el rango."
    />
  );
}

function OffersListTable({
  from,
  to,
  userId,
  enabled,
}: {
  from: string;
  to: string;
  userId: string | null;
  enabled: boolean;
}) {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(ALL_OFFERS_DEFAULT_PAGE_SIZE);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useOffersAnalyticsList(from, to, {
    userId,
    page: pageIndex + 1,
    pageSize,
    search: debouncedSearch || null,
    enabled,
  });

  const columns = useMemo<ColumnDef<OffersAnalyticsListItem>[]>(
    () => [
      {
        accessorKey: "offerNumber",
        header: "Cotización",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.offerNumber}</span>
        ),
      },
      {
        id: "customer",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{row.original.customerName}</p>
            {row.original.customerCompany ? (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.customerCompany}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "createdBy",
        header: "Creada por",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate">{listItemFullName(row.original)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.createdBy.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "itemCount",
        header: "Vallas",
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.itemCount}</span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            {formatMoney(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Creada",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatShortDate(new Date(row.original.createdAt))}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <MyOfferStatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPageIndex(0);
  }

  return (
    <DataTable
      columns={columns}
      data={data?.data ?? []}
      isLoading={isLoading || isFetching}
      searchValue={search}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Buscar por número, cliente o correo..."
      emptyMessage="No hay cotizaciones que coincidan con el filtro."
      manualPagination={{
        pageIndex,
        pageSize,
        total: data?.total ?? 0,
        onPageIndexChange: setPageIndex,
        onPageSizeChange: handlePageSizeChange,
      }}
    />
  );
}
