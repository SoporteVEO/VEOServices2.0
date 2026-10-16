"use client";

import { useState } from "react";
import { useInvoices } from "@/api/finance/invoicing.get";
import type { BriloClientOption } from "@/api/offers/offers.types";
import { BriloClientCombobox } from "@/components/pages/my-space/brilo-client-combobox";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { FinanceDateRangeFilter } from "../shared/finance-date-range-filter";
import { currentMonthRange } from "../shared/finance-format";
import { useFinancePaging } from "../shared/use-finance-paging";
import { InvoiceDrawer } from "./invoice-drawer";
import { INVOICE_COLUMNS } from "./invoicing-columns";

export function InvoicesTable() {
  const [number, setNumber] = useState("");
  const [client, setClient] = useState<BriloClientOption | null>(null);
  const [range, setRange] = useState(currentMonthRange);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const paging = useFinancePaging();
  const debouncedNumber = useDebouncedValue(number.trim(), 300);

  const { data, isLoading, isFetching } = useInvoices({
    ...range,
    number: debouncedNumber || undefined,
    clientCode: client?.cliNumero ?? undefined,
    page: paging.page,
    pageSize: paging.pageSize,
  });

  return (
    <>
      <DataTable
        className="min-h-0 flex-1"
        columns={INVOICE_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={number}
        onSearchChange={(value) => {
          setNumber(value);
          paging.reset();
        }}
        searchPlaceholder="Buscar por número de documento..."
        emptyMessage="No hay facturas en este rango."
        onRowClick={(row) => setSelectedId(row.mfaId)}
        sideButtons={
          <div className="flex flex-wrap items-center gap-3">
            <BriloClientCombobox
              label=""
              required={false}
              className="w-72"
              value={client}
              onChange={(next) => {
                setClient(next);
                paging.reset();
              }}
            />
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
      <InvoiceDrawer
        mfaId={selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </>
  );
}
