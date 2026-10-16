"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AccountingAccountsTable,
  AccountingCostCentersTable,
} from "./accounting-catalog-table";
import { AccountingEntriesTable } from "./accounting-entries-table";

const TAB_CONTENT_CLASS =
  "flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden";

export function AccountingPage() {
  const [tab, setTab] = useState("partidas");

  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="self-start">
          <TabsTrigger value="partidas">Partidas</TabsTrigger>
          <TabsTrigger value="cuentas">Catálogo de cuentas</TabsTrigger>
          <TabsTrigger value="centros">Centros de costo</TabsTrigger>
        </TabsList>

        <TabsContent value="partidas" className={TAB_CONTENT_CLASS}>
          <AccountingEntriesTable />
        </TabsContent>
        <TabsContent value="cuentas" className={TAB_CONTENT_CLASS}>
          <AccountingAccountsTable />
        </TabsContent>
        <TabsContent value="centros" className={TAB_CONTENT_CLASS}>
          <AccountingCostCentersTable />
        </TabsContent>
      </Tabs>
    </section>
  );
}
