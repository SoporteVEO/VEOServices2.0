"use client";

import { useState } from "react";
import { CheckCheck, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { getOrderPdf, useOrder } from "@/api/finance/invoicing.get";
import { useFinalizeOrder } from "@/api/finance/invoicing.mutations";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { DrawerFooter } from "@/components/ui/drawer";
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
import { INVOICE_LINE_COLUMNS, invoiceClientName } from "./invoicing-columns";
import { OrderEmailDialog } from "./order-email-dialog";

type Props = {
  mfaId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function OrderDrawer({ mfaId, onOpenChange }: Props) {
  return (
    <FinanceDrawer open={mfaId != null} onOpenChange={onOpenChange}>
      {mfaId != null ? (
        <OrderBody
          key={mfaId}
          mfaId={mfaId}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </FinanceDrawer>
  );
}

async function openPdf(mfaId: number) {
  const tab = window.open("", "_blank");
  try {
    const blob = await getOrderPdf(mfaId);
    const url = URL.createObjectURL(blob);
    if (tab) tab.location.href = url;
    else window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    toast.error(errorText(error, "No se pudo generar el PDF."));
  }
}

function OrderBody({ mfaId, onClose }: { mfaId: number; onClose: () => void }) {
  const { data, isLoading, isError } = useOrder(mfaId);
  const finalize = useFinalizeOrder();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  if (isLoading || isError || !data) {
    return (
      <FinanceDrawerState
        isLoading={isLoading}
        isError={isError || !data}
        errorMessage="No pudimos cargar esta orden desde Brilo."
      />
    );
  }

  const { order, totals } = data;
  const lines = order.detFactura ?? [];
  const documentLabel = `${order.mfaTipoDoc ?? ""} ${order.mfaNumDoc ?? ""}`.trim();
  const isOpen = !order.mfaFinalizada && !order.mfaPosteada && !order.mfaAnulada;

  return (
    <>
      <FinanceDrawerHeader
        onClose={onClose}
        title={
          <>
            <span className="font-mono text-sm">{documentLabel}</span>
            <FinanceStatusBadge
              annulled={order.mfaAnulada}
              posted={order.mfaPosteada}
              finalized={order.mfaFinalizada}
            />
          </>
        }
        description={order.mfaTitulo ?? invoiceClientName(order)}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          <FinanceInfoGrid
            items={[
              { label: "Cliente", value: invoiceClientName(order) },
              { label: "Código", value: order.cliNumero ?? "—" },
              { label: "Fecha", value: formatBriloShortDate(order.mfaFecha) },
              { label: "Forma de pago", value: order.mfaFormaPago ?? "—" },
              { label: "Vendedor", value: order.vndCodigo ?? "—" },
              { label: "Sucursal", value: order.sucCodigo ?? "—" },
            ]}
          />

          {order.mfaConceptoDoc ? (
            <p className="whitespace-pre-wrap rounded-lg border bg-card p-3 text-sm text-muted-foreground">
              {order.mfaConceptoDoc}
            </p>
          ) : null}

          <FinanceSection title={`Detalle (${lines.length})`}>
            <DataTable
              columns={INVOICE_LINE_COLUMNS}
              data={lines}
              rowSize="sm"
              emptyMessage="Sin líneas de detalle."
            />
          </FinanceSection>

          {totals ? (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 text-sm sm:grid-cols-3">
              <TotalItem label="Subtotal" value={totals.subTotal} />
              <TotalItem label="Impuesto" value={totals.impuesto} />
              <TotalItem label="Exento" value={totals.exento} />
              <TotalItem label="Percepción" value={totals.percepcion} />
              <TotalItem label="Retención" value={totals.retencion} />
              <TotalItem label="Total" value={totals.total} strong />
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <DrawerFooter className="border-t">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            icon={FileText}
            loading={pdfLoading}
            onClick={async () => {
              setPdfLoading(true);
              await openPdf(mfaId);
              setPdfLoading(false);
            }}
          >
            Ver PDF
          </Button>
          <Button
            variant="outline"
            icon={Mail}
            onClick={() => setEmailOpen(true)}
          >
            Enviar por correo
          </Button>
          {isOpen ? (
            <Button icon={CheckCheck} onClick={() => setConfirmOpen(true)}>
              Finalizar
            </Button>
          ) : null}
        </div>
      </DrawerFooter>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Finalizar orden de facturación"
        description={`La orden ${documentLabel} quedará lista para postearse en Brilo y ya no podrá editarse.`}
        confirmLabel="Finalizar"
        pending={finalize.isPending}
        onConfirm={() =>
          finalize.mutate(mfaId, {
            onSuccess: () => {
              toast.success("Orden finalizada.");
              setConfirmOpen(false);
            },
            onError: (error) =>
              toast.error(errorText(error, "No se pudo finalizar la orden.")),
          })
        }
      />

      <OrderEmailDialog
        mfaId={mfaId}
        documentLabel={documentLabel}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />
    </>
  );
}

function TotalItem({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={strong ? "font-semibold tabular-nums" : "tabular-nums"}>
        {formatAmount(value)}
      </p>
    </div>
  );
}
