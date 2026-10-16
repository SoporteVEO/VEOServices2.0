"use client";

import { useState } from "react";
import { HandCoins } from "lucide-react";
import type { SaldoCxcCliente } from "@/api/finance/finance.types";
import {
  useCreditLimits,
  useInvoicePayments,
  useReceivableBalances,
} from "@/api/finance/receivables.get";
import type { BriloClientOption } from "@/api/offers/offers.types";
import { BriloClientCombobox } from "@/components/pages/my-space/brilo-client-combobox";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { FinanceDateRangeFilter } from "../shared/finance-date-range-filter";
import { currentMonthRange } from "../shared/finance-format";
import { useFinancePaging } from "../shared/use-finance-paging";
import { ReceivableBalanceDrawer } from "./receivable-balance-drawer";
import type { PaymentPreset } from "./receivable-payment-dialog";
import {
  BALANCE_COLUMNS,
  CREDIT_LIMIT_COLUMNS,
  INVOICE_PAYMENT_COLUMNS,
} from "./receivables-columns";

type RegisterPayment = (preset: PaymentPreset) => void;

function ClientFilter({
  value,
  onChange,
}: {
  value: BriloClientOption | null;
  onChange: (client: BriloClientOption | null) => void;
}) {
  return (
    <BriloClientCombobox
      label=""
      required={false}
      className="w-72"
      value={value}
      onChange={onChange}
    />
  );
}

export function ReceivableBalancesTable({
  onRegisterPayment,
}: {
  onRegisterPayment: RegisterPayment;
}) {
  const [client, setClient] = useState<BriloClientOption | null>(null);
  const [selected, setSelected] = useState<SaldoCxcCliente | null>(null);
  const paging = useFinancePaging();
  const { data, isLoading, isFetching } = useReceivableBalances({
    clientCode: client?.cliNumero ?? undefined,
    page: paging.page,
    pageSize: paging.pageSize,
  });

  return (
    <>
      <DataTable
        className="min-h-0 flex-1"
        columns={BALANCE_COLUMNS}
        data={data?.data ?? []}
        isLoading={isLoading || isFetching}
        emptyMessage="No hay saldos pendientes."
        onRowClick={setSelected}
        sideButtons={
          <div className="flex flex-wrap items-center gap-3">
            <ClientFilter
              value={client}
              onChange={(next) => {
                setClient(next);
                paging.reset();
              }}
            />
            <Button icon={HandCoins} onClick={() => onRegisterPayment({})}>
              Registrar pago
            </Button>
          </div>
        }
        manualPagination={paging.pagination(data?.total ?? 0)}
      />
      <ReceivableBalanceDrawer
        balance={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onRegisterPayment={onRegisterPayment}
      />
    </>
  );
}

export function ReceivablePaymentsTable() {
  const [client, setClient] = useState<BriloClientOption | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [range, setRange] = useState(currentMonthRange);
  const paging = useFinancePaging();
  const debouncedInvoice = useDebouncedValue(invoiceNumber.trim(), 300);
  const { data, isLoading, isFetching } = useInvoicePayments({
    ...range,
    clientCode: client?.cliNumero ?? undefined,
    invoiceNumber: debouncedInvoice || undefined,
    page: paging.page,
    pageSize: paging.pageSize,
  });

  return (
    <DataTable
      className="min-h-0 flex-1"
      columns={INVOICE_PAYMENT_COLUMNS}
      data={data?.data ?? []}
      isLoading={isLoading || isFetching}
      searchValue={invoiceNumber}
      onSearchChange={(value) => {
        setInvoiceNumber(value);
        paging.reset();
      }}
      searchPlaceholder="Buscar por número de factura..."
      emptyMessage="No hay abonos en este rango."
      sideButtons={
        <div className="flex flex-wrap items-center gap-3">
          <ClientFilter
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
  );
}

export function CreditLimitsTable() {
  const [client, setClient] = useState<BriloClientOption | null>(null);
  const paging = useFinancePaging();
  const { data, isLoading, isFetching } = useCreditLimits({
    clientCode: client?.cliNumero ?? undefined,
    page: paging.page,
    pageSize: paging.pageSize,
  });

  return (
    <DataTable
      className="min-h-0 flex-1"
      columns={CREDIT_LIMIT_COLUMNS}
      data={data?.data ?? []}
      isLoading={isLoading || isFetching}
      emptyMessage="No hay límites de crédito configurados."
      sideButtons={
        <ClientFilter
          value={client}
          onChange={(next) => {
            setClient(next);
            paging.reset();
          }}
        />
      }
      manualPagination={paging.pagination(data?.total ?? 0)}
    />
  );
}
