"use client";

import { HandCoins } from "lucide-react";
import type { SaldoCxcCliente } from "@/api/finance/finance.types";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DrawerFooter } from "@/components/ui/drawer";
import {
  FinanceDrawer,
  FinanceDrawerHeader,
  FinanceInfoGrid,
  FinanceSection,
} from "../shared/finance-drawer";
import { formatAmount } from "../shared/finance-format";
import type { PaymentPreset } from "./receivable-payment-dialog";
import { overdueAmount, receivableDocColumns } from "./receivables-columns";

type Props = {
  balance: SaldoCxcCliente | null;
  onOpenChange: (open: boolean) => void;
  onRegisterPayment: (preset: PaymentPreset) => void;
};

export function ReceivableBalanceDrawer({
  balance,
  onOpenChange,
  onRegisterPayment,
}: Props) {
  return (
    <FinanceDrawer open={balance != null} onOpenChange={onOpenChange}>
      {balance ? (
        <BalanceBody
          balance={balance}
          onClose={() => onOpenChange(false)}
          onRegisterPayment={onRegisterPayment}
        />
      ) : null}
    </FinanceDrawer>
  );
}

function BalanceBody({
  balance,
  onClose,
  onRegisterPayment,
}: {
  balance: SaldoCxcCliente;
  onClose: () => void;
  onRegisterPayment: (preset: PaymentPreset) => void;
}) {
  const docs = balance.detFacturas ?? [];
  const clientPreset: PaymentPreset = {
    clientCode: balance.cliNumero ?? undefined,
    clientName: balance.nomCliente,
  };

  const columns = receivableDocColumns((doc) => (
    <Button
      variant="ghost"
      sizeVariant="sm"
      onClick={() =>
        onRegisterPayment({
          ...clientPreset,
          mode: "invoice",
          invoiceNumber: doc.mfaNumDoc ?? undefined,
          amount: doc.saldo,
        })
      }
    >
      Abonar
    </Button>
  ));

  return (
    <>
      <FinanceDrawerHeader
        onClose={onClose}
        title={balance.nomCliente ?? "Cliente"}
        description={`Código ${balance.cliNumero ?? "—"}`}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 p-4">
          <FinanceInfoGrid
            items={[
              { label: "Saldo total", value: formatAmount(balance.saldo) },
              { label: "Vencido", value: formatAmount(overdueAmount(docs)) },
              { label: "Estado", value: balance.cliStatus ?? "—" },
            ]}
          />
          <FinanceSection title={`Documentos pendientes (${docs.length})`}>
            <DataTable
              columns={columns}
              data={docs}
              rowSize="sm"
              emptyMessage="El cliente no tiene documentos pendientes."
            />
          </FinanceSection>
        </div>
      </ScrollArea>

      <DrawerFooter className="border-t">
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onRegisterPayment({ ...clientPreset, mode: "advance" })}
          >
            Registrar anticipo
          </Button>
          <Button
            icon={HandCoins}
            onClick={() =>
              onRegisterPayment({
                ...clientPreset,
                mode: "client",
                amount: balance.saldo,
              })
            }
          >
            Abonar a cliente
          </Button>
        </div>
      </DrawerFooter>
    </>
  );
}
