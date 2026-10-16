"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useEntries, useEntryTypes } from "@/api/finance/accounting.get";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
import { ENTRY_COLUMNS } from "./accounting-columns";
import { AccountingEntryDrawer } from "./accounting-entry-drawer";
import { AccountingEntryFormDialog } from "./accounting-entry-form-dialog";

const ALL = "ALL";

export function AccountingEntriesTable() {
  const [number, setNumber] = useState("");
  const [typeCode, setTypeCode] = useState(ALL);
  const [range, setRange] = useState(currentMonthRange);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const paging = useFinancePaging();
  const debouncedNumber = useDebouncedValue(number.trim(), 300);
  const { data: entryTypes = [] } = useEntryTypes();

  const { data, isLoading, isFetching } = useEntries({
    ...range,
    number: debouncedNumber || undefined,
    typeCode: typeCode === ALL ? undefined : typeCode,
    page: paging.page,
    pageSize: paging.pageSize,
  });

  return (
    <>
      <DataTable
        className="min-h-0 flex-1"
        columns={ENTRY_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        searchValue={number}
        onSearchChange={(value) => {
          setNumber(value);
          paging.reset();
        }}
        searchPlaceholder="Buscar por número de partida..."
        emptyMessage="No hay partidas en este rango."
        onRowClick={(row) => setSelectedId(row.mpaId)}
        sideButtons={
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={typeCode}
              onValueChange={(value) => {
                setTypeCode(value);
                paging.reset();
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo de partida" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los tipos</SelectItem>
                {entryTypes.map((type) =>
                  type.tpaCodigo ? (
                    <SelectItem key={type.tpaId} value={type.tpaCodigo}>
                      {type.tpaNombre ?? type.tpaCodigo}
                    </SelectItem>
                  ) : null,
                )}
              </SelectContent>
            </Select>
            <FinanceDateRangeFilter
              value={range}
              onChange={(next) => {
                setRange(next);
                paging.reset();
              }}
            />
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              Nueva partida
            </Button>
          </div>
        }
        manualPagination={paging.pagination(data?.total ?? 0)}
      />

      <AccountingEntryDrawer
        mpaId={selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />

      <AccountingEntryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(entry) => setSelectedId(entry.mpaId)}
      />
    </>
  );
}
