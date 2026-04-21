"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useActiveContracts } from "@/api/contracts/contracts.get";
import { MaintenanceContractsTable } from "@/components/pages/reports";

export default function ReportsPage() {
  const [tab, setTab] = useState("mantenimiento");

  const { data: activeContracts = [], isLoading } = useActiveContracts();

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
      </TabsList>

      <TabsContent value="mantenimiento" className="pt-4">
        <MaintenanceContractsTable
          contracts={activeContracts}
          isLoading={isLoading}
        />
      </TabsContent>
    </Tabs>
  );
}
