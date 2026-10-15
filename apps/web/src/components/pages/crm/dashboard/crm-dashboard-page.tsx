"use client";

import { useState } from "react";
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { useCrmDashboard } from "@/api/crm/crm.get";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmPipelineSelect } from "../shared/crm-pipeline-select";
import { CrmScopeToggle, type CrmScope } from "../shared/crm-scope-toggle";
import { CrmDashboardCharts } from "./crm-dashboard-charts";
import { CrmDashboardKpis } from "./crm-dashboard-kpis";
import { CrmDashboardLists } from "./crm-dashboard-lists";
import { CrmDashboardOffers } from "./crm-dashboard-offers";
import { CrmDashboardOoh } from "./crm-dashboard-ooh";
import { CrmLeaderboard } from "./crm-leaderboard";

function defaultRange(): { from: Date; to: Date } {
  return { from: startOfMonth(new Date()), to: new Date() };
}

export function CrmDashboardPage() {
  const [scope, setScope] = useState<CrmScope>("mine");
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [range, setRange] = useState(defaultRange);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useCrmDashboard({
    scope,
    pipelineId: pipelineId ?? undefined,
    from: startOfDay(range.from).toISOString(),
    to: endOfDay(range.to).toISOString(),
  });

  const busy = isLoading || (isFetching && !data);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <CrmScopeToggle value={scope} onChange={setScope} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <CrmPipelineSelect value={pipelineId} onChange={setPipelineId} />
          <DateRangePicker
            showCompare={false}
            initialDateFrom={range.from}
            initialDateTo={range.to}
            align="end"
            onUpdate={({ range: next }) =>
              setRange({ from: next.from, to: next.to ?? next.from })
            }
          />
        </div>
      </div>

      <CrmDashboardKpis dashboard={data} isLoading={busy} />

      <CrmDashboardOoh dashboard={data} isLoading={busy} onOpenDeal={setSelectedDealId} />

      <CrmDashboardCharts dashboard={data} isLoading={busy} />

      <CrmDashboardLists
        dashboard={data}
        isLoading={busy}
        onOpenDeal={setSelectedDealId}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CrmDashboardOffers
          dashboard={data}
          isLoading={busy}
          onDealCreated={setSelectedDealId}
        />
        {scope === "team" ? (
          <CrmLeaderboard dashboard={data} isLoading={busy} />
        ) : null}
      </div>

      <CrmDealDrawer
        dealId={selectedDealId}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
      />
    </div>
  );
}
