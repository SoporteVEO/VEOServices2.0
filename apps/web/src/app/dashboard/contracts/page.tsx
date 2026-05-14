"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  NotifiedContractsTable,
  ContractsTable,
} from "@/components/pages/contracts";
import {
  useEndingSoonContracts,
  useNotifiedContracts,
} from "@/api/contracts/contracts.get";

export default function ContractsPage() {
  const [tab, setTab] = useState("contratos-por-vencer");

  const {
    data: endingSoonContracts = [],
    isLoading: isEndingSoonContractsLoading,
  } = useEndingSoonContracts({
    // TODO: Get from query params and put a date selector
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 15)),
  });

  const {
    data: notifiedContracts = [],
    isLoading: isNotifiedContractsLoading,
  } = useNotifiedContracts();

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="contratos-por-vencer">
          Contratos por vencer
        </TabsTrigger>
        <TabsTrigger value="notificaciones">Notificados</TabsTrigger>
      </TabsList>

      <TabsContent value="contratos-por-vencer">
        <ContractsTable
          contracts={endingSoonContracts}
          isLoading={isEndingSoonContractsLoading}
        />
      </TabsContent>

      <TabsContent value="notificaciones">
        <NotifiedContractsTable
          contracts={notifiedContracts}
          isLoading={isNotifiedContractsLoading}
        />
      </TabsContent>
    </Tabs>
  );
}
