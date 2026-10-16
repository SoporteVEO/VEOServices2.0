"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ReceivablePaymentDialog,
  type PaymentPreset,
} from "./receivable-payment-dialog";
import {
  CreditLimitsTable,
  ReceivableBalancesTable,
  ReceivablePaymentsTable,
} from "./receivables-tables";

const TAB_CONTENT_CLASS =
  "flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden";

export function ReceivablesPage() {
  const [tab, setTab] = useState("saldos");
  const [paymentPreset, setPaymentPreset] = useState<PaymentPreset | null>(
    null,
  );

  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="self-start">
          <TabsTrigger value="saldos">Saldos</TabsTrigger>
          <TabsTrigger value="abonos">Abonos a facturas</TabsTrigger>
          <TabsTrigger value="limites">Límites de crédito</TabsTrigger>
        </TabsList>

        <TabsContent value="saldos" className={TAB_CONTENT_CLASS}>
          <ReceivableBalancesTable onRegisterPayment={setPaymentPreset} />
        </TabsContent>
        <TabsContent value="abonos" className={TAB_CONTENT_CLASS}>
          <ReceivablePaymentsTable />
        </TabsContent>
        <TabsContent value="limites" className={TAB_CONTENT_CLASS}>
          <CreditLimitsTable />
        </TabsContent>
      </Tabs>

      <ReceivablePaymentDialog
        open={paymentPreset != null}
        onOpenChange={(open) => {
          if (!open) setPaymentPreset(null);
        }}
        preset={paymentPreset}
      />
    </section>
  );
}
