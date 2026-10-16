"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicesTable } from "./invoices-table";
import { OrdersTable } from "./orders-table";

const TAB_CONTENT_CLASS =
  "flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden";

export function InvoicingPage() {
  const [tab, setTab] = useState("facturas");

  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="self-start">
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="ordenes">Órdenes de facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="facturas" className={TAB_CONTENT_CLASS}>
          <InvoicesTable />
        </TabsContent>
        <TabsContent value="ordenes" className={TAB_CONTENT_CLASS}>
          <OrdersTable />
        </TabsContent>
      </Tabs>
    </section>
  );
}
