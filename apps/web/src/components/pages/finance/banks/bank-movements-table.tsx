"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBankCharges, useBankDeposits } from "@/api/finance/banks.get";
import {
  useDeleteBankMovement,
  type BankMovementKind,
} from "@/api/finance/banks.mutations";
import type {
  AbonoBanco,
  BankMovementsQuery,
  CargoBanco,
} from "@/api/finance/finance.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { FinanceDateRangeFilter } from "../shared/finance-date-range-filter";
import { currentMonthRange, errorText } from "../shared/finance-format";
import { useFinancePaging } from "../shared/use-finance-paging";
import { BankMovementFormDialog } from "./bank-movement-form-dialog";
import { bankMovementColumns, type BankMovementRow } from "./banks-columns";

const COPY: Record<BankMovementKind, { noun: string; create: string }> = {
  deposits: { noun: "abono", create: "Nuevo abono" },
  charges: { noun: "cargo", create: "Nuevo cargo" },
};

function fromDeposit(row: AbonoBanco): BankMovementRow {
  return {
    id: row.abnId,
    number: row.abnNumero,
    date: row.abnFecha,
    bankDate: row.abnFechaAplicaBanco,
    account: row.bcuNumero,
    typeCode: row.tabCodigo,
    reason: row.abnMotivo,
    amount: row.abnMonto,
    currency: row.monCodigo,
    posted: row.abnPosteado,
    annulled: row.abnAnulado,
  };
}

function fromCharge(row: CargoBanco): BankMovementRow {
  return {
    id: row.crgId,
    number: row.crgNumero,
    date: row.crgFecha,
    bankDate: row.crgFechaAplicaBanco,
    account: row.bcuNumero,
    typeCode: row.tcbCodigo,
    reason: row.crgMotivo,
    creditor: row.crgAcreedor,
    amount: row.crgMonto,
    currency: row.monCodigo,
    posted: row.crgPosteado,
    annulled: row.crgAnulado,
  };
}

function useMovements(kind: BankMovementKind, query: BankMovementsQuery) {
  const deposits = useBankDeposits(query, kind === "deposits");
  const charges = useBankCharges(query, kind === "charges");
  const active = kind === "deposits" ? deposits : charges;
  const rows = useMemo(
    () =>
      kind === "deposits"
        ? (deposits.data?.data ?? []).map(fromDeposit)
        : (charges.data?.data ?? []).map(fromCharge),
    [kind, deposits.data, charges.data],
  );
  return {
    rows,
    total: active.data?.total ?? 0,
    isLoading: active.isLoading || active.isFetching,
  };
}

export function BankMovementsTable({ kind }: { kind: BankMovementKind }) {
  const copy = COPY[kind];
  const [number, setNumber] = useState("");
  const [range, setRange] = useState(currentMonthRange);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<BankMovementRow | null>(null);
  const paging = useFinancePaging();
  const debouncedNumber = useDebouncedValue(number.trim(), 300);
  const deleteMovement = useDeleteBankMovement(kind);

  const { rows, total, isLoading } = useMovements(kind, {
    ...(debouncedNumber ? { number: debouncedNumber } : range),
    page: paging.page,
    pageSize: paging.pageSize,
  });

  const columns = useMemo(
    () =>
      bankMovementColumns(kind, (row) =>
        row.posted || row.annulled ? null : (
          <PrimitiveButton
            variant="ghost"
            size="icon"
            className="size-7 text-destructive"
            aria-label={`Eliminar ${copy.noun}`}
            onClick={(event) => {
              event.stopPropagation();
              setDeleting(row);
            }}
          >
            <Trash2 className="size-3.5" />
          </PrimitiveButton>
        ),
      ),
    [kind, copy.noun],
  );

  return (
    <>
      <DataTable
        className="min-h-0 flex-1"
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchValue={number}
        onSearchChange={(value) => {
          setNumber(value);
          paging.reset();
        }}
        searchPlaceholder={`Buscar ${copy.noun} por número...`}
        emptyMessage={`No hay ${copy.noun}s en este rango.`}
        sideButtons={
          <div className="flex flex-wrap items-center gap-3">
            <FinanceDateRangeFilter
              value={range}
              onChange={(next) => {
                setRange(next);
                paging.reset();
              }}
            />
            <Button icon={Plus} onClick={() => setCreateOpen(true)}>
              {copy.create}
            </Button>
          </div>
        }
        manualPagination={paging.pagination(total)}
      />

      <BankMovementFormDialog
        kind={kind}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Eliminar ${copy.noun}`}
        description={`Se eliminará el ${copy.noun} ${deleting?.number ?? ""} en Brilo. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        pending={deleteMovement.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteMovement.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(`El ${copy.noun} fue eliminado.`);
              setDeleting(null);
            },
            onError: (error) =>
              toast.error(errorText(error, "No se pudo eliminar.")),
          });
        }}
      />
    </>
  );
}
