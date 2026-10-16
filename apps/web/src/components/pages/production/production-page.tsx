"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePendingPrintRescheduleRequests } from "@/api/print-reschedule-requests/print-reschedule-requests.get";
import { Badge } from "@/components/primitives/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionCalendar } from "./calendar";
import { ProductionOrdersTable } from "./production-orders-table";
import { PrintRescheduleRequestsPanel } from "./reschedule-requests/print-reschedule-requests-panel";

const TABS = ["ordenes", "calendario", "solicitudes"] as const;
type ProductionTab = (typeof TABS)[number];

function parseTab(value: string | null): ProductionTab {
  return TABS.find((tab) => tab === value) ?? "ordenes";
}

export function ProductionPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const { data: requests } = usePendingPrintRescheduleRequests();
  const pendingCount = requests?.length ?? 0;
  const hasUrgent = requests?.some((request) => request.isUrgent) ?? false;

  function handleTabChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="self-start">
          <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
          <TabsTrigger value="solicitudes" className="gap-1.5">
            Solicitudes
            {pendingCount > 0 ? (
              <Badge
                variant={hasUrgent ? "destructive" : "secondary"}
                className="h-4 min-w-4 px-1 font-mono text-[10px] tabular-nums"
              >
                {pendingCount}
              </Badge>
            ) : null}
          </TabsTrigger>
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

        <TabsContent
          value="solicitudes"
          className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <PrintRescheduleRequestsPanel
            onOpenCalendar={() => handleTabChange("calendario")}
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
