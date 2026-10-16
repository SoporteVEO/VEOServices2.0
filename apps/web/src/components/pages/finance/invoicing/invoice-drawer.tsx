"use client";

import { useInvoice } from "@/api/finance/invoicing.get";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { DataTable } from "@/components/ui/data-table";
import { formatBriloShortDate } from "@/lib/format";
import { INVOICE_PAYMENT_COLUMNS } from "../receivables/receivables-columns";
import {
  FinanceDrawer,
  FinanceDrawerHeader,
  FinanceDrawerState,
  FinanceInfoGrid,
  FinanceSection,
} from "../shared/finance-drawer";
import { formatAmount } from "../shared/finance-format";
import { FinanceStatusBadge } from "../shared/finance-status-badge";
import { INVOICE_LINE_COLUMNS, invoiceClientName } from "./invoicing-columns";

type Props = {
  mfaId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceDrawer({ mfaId, onOpenChange }: Props) {
  return (
    <FinanceDrawer open={mfaId != null} onOpenChange={onOpenChange}>
      {mfaId != null ? (
        <InvoiceBody
          key={mfaId}
          mfaId={mfaId}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </FinanceDrawer>
  );
}

function InvoiceBody({
  mfaId,
  onClose,
}: {
  mfaId: number;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useInvoice(mfaId);

  if (isLoading || isError || !data) {
    return (
      <FinanceDrawerState
        isLoading={isLoading}
        isError={isError || !data}
        errorMessage="No pudimos cargar esta factura desde Brilo."
      />
    );
  }

  const { invoice, payments } = data;
  const lines = invoice.detFactura ?? [];

  return (
    <>
      <FinanceDrawerHeader
        onClose={onClose}
        title={
          <>
            <span className="font-mono text-sm">
              {invoice.mfaTipoDoc} {invoice.mfaNumDoc}
            </span>
            <FinanceStatusBadge
              annulled={invoice.mfaAnulada}
              posted={invoice.mfaPosteada}
              finalized={invoice.mfaFinalizada}
            />
          </>
        }
        description={`${invoiceClientName(invoice)} · ${invoice.cliNumero ?? ""}`}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          <FinanceInfoGrid
            items={[
              { label: "Fecha", value: formatBriloShortDate(invoice.mfaFecha) },
              {
                label: "Vence",
                value: formatBriloShortDate(invoice.mfaFechaVence),
              },
              { label: "NIT", value: invoice.mfaNITCliente ?? "—" },
              { label: "Forma de pago", value: invoice.mfaFormaPago ?? "—" },
              {
                label: "Plazo",
                value:
                  invoice.mfaPlazoCredito != null
                    ? `${invoice.mfaPlazoCredito} días`
                    : "—",
              },
              { label: "Vendedor", value: invoice.vndCodigo ?? "—" },
            ]}
          />

          {invoice.mfaTitulo || invoice.mfaConceptoDoc ? (
            <div className="rounded-lg border bg-card p-3 text-sm">
              {invoice.mfaTitulo ? (
                <p className="font-medium">{invoice.mfaTitulo}</p>
              ) : null}
              {invoice.mfaConceptoDoc ? (
                <p className="whitespace-pre-wrap pt-1 text-muted-foreground">
                  {invoice.mfaConceptoDoc}
                </p>
              ) : null}
            </div>
          ) : null}

          <FinanceSection title={`Detalle (${lines.length})`}>
            <DataTable
              columns={INVOICE_LINE_COLUMNS}
              data={lines}
              rowSize="sm"
              emptyMessage="Sin líneas de detalle."
            />
          </FinanceSection>

          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-3 text-sm sm:grid-cols-4">
            <Amount label="Afecto" value={invoice.mfaSumasAfecto} />
            <Amount label="Exento" value={invoice.mfaSumasExento} />
            <Amount label="Total" value={invoice.mfaGranTotal} strong />
            <Amount label="Saldo" value={invoice.saldoFactura} strong />
          </div>

          <FinanceSection title={`Abonos (${payments.length})`}>
            <DataTable
              columns={INVOICE_PAYMENT_COLUMNS}
              data={payments}
              rowSize="sm"
              emptyMessage="La factura no tiene abonos registrados."
            />
          </FinanceSection>
        </div>
      </ScrollArea>
    </>
  );
}

function Amount({
  label,
  value,
  strong,
}: {
  label: string;
  value: number | null | undefined;
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
