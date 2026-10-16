"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEntry } from "@/api/finance/accounting.get";
import { useDeleteEntryLine } from "@/api/finance/accounting.mutations";
import type { DetallePartida } from "@/api/finance/finance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { formatBriloShortDate } from "@/lib/format";
import {
  FinanceDrawer,
  FinanceDrawerHeader,
  FinanceDrawerState,
  FinanceInfoGrid,
  FinanceSection,
} from "../shared/finance-drawer";
import { errorText, formatAmount } from "../shared/finance-format";
import { FinanceStatusBadge } from "../shared/finance-status-badge";
import { entryLineColumns } from "./accounting-columns";
import { AccountingLineFormDialog } from "./accounting-line-form-dialog";

type Props = {
  mpaId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function AccountingEntryDrawer({ mpaId, onOpenChange }: Props) {
  return (
    <FinanceDrawer open={mpaId != null} onOpenChange={onOpenChange}>
      {mpaId != null ? (
        <EntryBody
          key={mpaId}
          mpaId={mpaId}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </FinanceDrawer>
  );
}

function EntryBody({ mpaId, onClose }: { mpaId: number; onClose: () => void }) {
  const { data, isLoading, isError } = useEntry(mpaId);
  const deleteLine = useDeleteEntryLine();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DetallePartida | null>(null);
  const [deleting, setDeleting] = useState<DetallePartida | null>(null);

  const canEdit = data?.entry.puedeModificarDetalle ?? false;

  const columns = useMemo(
    () =>
      entryLineColumns(
        canEdit
          ? (line) => (
              <div className="flex justify-end gap-1">
                <PrimitiveButton
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label="Editar movimiento"
                  onClick={() => {
                    setEditing(line);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </PrimitiveButton>
                <PrimitiveButton
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive"
                  aria-label="Eliminar movimiento"
                  onClick={() => setDeleting(line)}
                >
                  <Trash2 className="size-3.5" />
                </PrimitiveButton>
              </div>
            )
          : undefined,
      ),
    [canEdit],
  );

  if (isLoading || isError || !data) {
    return (
      <FinanceDrawerState
        isLoading={isLoading}
        isError={isError || !data}
        errorMessage="No pudimos cargar esta partida desde Brilo."
      />
    );
  }

  const { entry, lines } = data;
  const totalDebit = lines.reduce((sum, line) => sum + (line.dpaDebe ?? 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.dpaHaber ?? 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;

  return (
    <>
      <FinanceDrawerHeader
        onClose={onClose}
        title={
          <>
            <span className="font-mono text-sm">
              Partida {entry.mpaNumero ?? entry.mpaId}
            </span>
            <FinanceStatusBadge
              annulled={entry.mpaAnulada}
              posted={entry.mpaPosteada}
            />
          </>
        }
        description={entry.mpaDescripcion}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          <FinanceInfoGrid
            items={[
              { label: "Fecha", value: formatBriloShortDate(entry.mpaFecha) },
              {
                label: "Tipo",
                value: entry.tpaNombre ?? entry.tpaCodigo ?? "—",
              },
              {
                label: "Origen",
                value: entry.mpaDeSistema ? "Sistema" : "Manual",
              },
            ]}
          />

          <FinanceSection
            title={`Movimientos (${lines.length})`}
            action={
              canEdit ? (
                <Button
                  sizeVariant="sm"
                  icon={Plus}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Agregar movimiento
                </Button>
              ) : (
                <Badge variant="secondary">Solo lectura</Badge>
              )
            }
          >
            <DataTable
              columns={columns}
              data={lines}
              rowSize="sm"
              emptyMessage="La partida aún no tiene movimientos."
            />
          </FinanceSection>

          <div className="grid grid-cols-3 gap-3 rounded-lg border bg-card p-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Total debe</p>
              <p className="font-semibold tabular-nums">
                {formatAmount(totalDebit)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total haber</p>
              <p className="font-semibold tabular-nums">
                {formatAmount(totalCredit)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Diferencia</p>
              <p
                className={
                  difference === 0
                    ? "font-semibold tabular-nums text-success"
                    : "font-semibold tabular-nums text-destructive"
                }
              >
                {formatAmount(difference)}
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>

      <AccountingLineFormDialog
        mpaId={mpaId}
        open={formOpen}
        onOpenChange={setFormOpen}
        line={editing}
      />

      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar movimiento"
        description={`Se eliminará el movimiento de la cuenta ${deleting?.cueCodigo ?? ""} en Brilo.`}
        confirmLabel="Eliminar"
        variant="destructive"
        pending={deleteLine.isPending}
        onConfirm={() => {
          if (!deleting) return;
          deleteLine.mutate(
            { mpaId, dpaId: deleting.dpaId },
            {
              onSuccess: () => {
                toast.success("Movimiento eliminado.");
                setDeleting(null);
              },
              onError: (error) =>
                toast.error(errorText(error, "No se pudo eliminar.")),
            },
          );
        }}
      />
    </>
  );
}
