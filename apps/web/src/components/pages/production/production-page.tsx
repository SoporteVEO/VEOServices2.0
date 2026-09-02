"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionCalendar } from "./calendar";
import { ProductionOrdersTable } from "./production-orders-table";

export function ProductionPage() {
  const [tab, setTab] = useState("ordenes");

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="self-start">
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent
          value="ordenes"
          className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <ProductionOrdersTable />
        </TabsContent>

        <TabsContent
          value="calendario"
          className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <ProductionCalendar />
        </TabsContent>
      </Tabs>
    </section>
  );
}
