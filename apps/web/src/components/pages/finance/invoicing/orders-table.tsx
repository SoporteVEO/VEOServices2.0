"use client";

import { useState } from "react";
import { Ban, CheckCheck, FilePen, Send } from "lucide-react";
import type { OrderDocType, OrderStatus } from "@/api/finance/finance.types";
import { useOrders } from "@/api/finance/invoicing.get";
import { DataTable } from "@/components/ui/data-table";
import { KpiGrid, KpiTile } from "@/components/ui/kpi-tile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { FinanceDateRangeFilter } from "../shared/finance-date-range-filter";
import { currentMonthRange } from "../shared/finance-format";
import { useFinancePaging } from "../shared/use-finance-paging";
import { ORDER_COLUMNS } from "./invoicing-columns";
import { OrderDrawer } from "./order-drawer";

const ALL = "ALL";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "O", label: "Abiertas" },
  { value: "F", label: "Finalizadas" },
  { value: "P", label: "Posteadas" },
];

const DOC_TYPE_OPTIONS: { value: OrderDocType; label: string }[] = [
  { value: "OFS", label: "Órdenes de facturación" },
  { value: "COT", label: "Cotizaciones" },
];

export function OrdersTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | typeof ALL>(ALL);
  const [docType, setDocType] = useState<OrderDocType>("OFS");
  const [range, setRange] = useState(currentMonthRange);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const paging = useFinancePaging();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isFetching } = useOrders({
    ...range,
    docType,
    status: status === ALL ? undefined : status,
    search: debouncedSearch || undefined,
    page: paging.page,
    pageSize: paging.pageSize,
  });
  const counts = data?.counts;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {counts ? (
        <KpiGrid>
          <KpiTile
            item={{ icon: FilePen, label: "Abiertas", value: counts.abiertas, tone: "amber" }}
          />
          <KpiTile
            item={{ icon: CheckCheck, label: "Finalizadas", value: counts.finalizadas, tone: "sky" }}
          />
          <KpiTile
            item={{ icon: Send, label: "Posteadas", value: counts.posteadas, tone: "emerald" }}
          />
          <KpiTile
            item={{ icon: Ban, label: "Anuladas", value: counts.anuladas, tone: "rose" }}
          />
        </KpiGrid>
      ) : null}

      <DataTable
        className="min-h-0 flex-1"
        columns={ORDER_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          paging.reset();
        }}
        searchPlaceholder="Buscar por número, cliente o título..."
        emptyMessage={
          data?.truncated
            ? "Demasiados resultados; acota el rango de fechas."
            : "No hay documentos en este rango."
        }
        onRowClick={(row) => setSelectedId(row.mfaId)}
        sideButtons={
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={docType}
              onValueChange={(value) => {
                setDocType(value as OrderDocType);
                paging.reset();
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as OrderStatus | typeof ALL);
                paging.reset();
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los estados</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FinanceDateRangeFilter
              value={range}
              onChange={(next) => {
                setRange(next);
                paging.reset();
              }}
            />
          </div>
        }
        manualPagination={paging.pagination(data?.total ?? 0)}
      />

      <OrderDrawer
        mfaId={selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
