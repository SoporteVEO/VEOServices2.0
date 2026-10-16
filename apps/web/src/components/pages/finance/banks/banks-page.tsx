"use client";

import { useState } from "react";
import { useBankCatalogs } from "@/api/finance/banks.get";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankMovementsTable } from "./bank-movements-table";
import { BANK_ACCOUNT_COLUMNS } from "./banks-columns";

const TAB_CONTENT_CLASS =
  "flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden";

function BankAccountsTable() {
  const { data, isLoading } = useBankCatalogs();
  return (
    <DataTable
      className="min-h-0 flex-1"
      columns={BANK_ACCOUNT_COLUMNS}
      data={data?.accounts ?? []}
      isLoading={isLoading}
      emptyMessage="No hay cuentas bancarias configuradas en Brilo."
      pagination={{ pageSize: 25 }}
    />
  );
}

export function BanksPage() {
  const [tab, setTab] = useState("abonos");

  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="self-start">
          <TabsTrigger value="abonos">Abonos</TabsTrigger>
          <TabsTrigger value="cargos">Cargos</TabsTrigger>
          <TabsTrigger value="cuentas">Cuentas bancarias</TabsTrigger>
        </TabsList>

        <TabsContent value="abonos" className={TAB_CONTENT_CLASS}>
          <BankMovementsTable kind="deposits" />
        </TabsContent>
        <TabsContent value="cargos" className={TAB_CONTENT_CLASS}>
          <BankMovementsTable kind="charges" />
        </TabsContent>
        <TabsContent value="cuentas" className={TAB_CONTENT_CLASS}>
          <BankAccountsTable />
        </TabsContent>
      </Tabs>
    </section>
  );
}
