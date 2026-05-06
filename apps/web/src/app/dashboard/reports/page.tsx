"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyContractsTable } from "@/components/pages/reports";

export default function ReportsPage() {
  const [tab, setTab] = useState("mensual");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="mensual">Mensual</TabsTrigger>
        <TabsTrigger value="instalacion">Instalación</TabsTrigger>
        <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
      </TabsList>

      <TabsContent value="mensual" className="pt-4">
        <MonthlyContractsTable />
      </TabsContent>
    </Tabs>
  );
}
