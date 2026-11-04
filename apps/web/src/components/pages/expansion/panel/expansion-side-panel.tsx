"use client";

import { useState } from "react";
import type { ExpansionSite } from "@/api/expansion/expansion.types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MappedBillboard, ZoneSummary } from "../expansion-analysis";
import { ExpansionRankingList } from "./expansion-ranking-list";
import { ExpansionSitesList } from "./expansion-sites-list";
import { ExpansionZonesList } from "./expansion-zones-list";

const TAB_CONTENT_CLASS = "flex min-h-0 flex-1 flex-col pb-0 data-[state=inactive]:hidden";

export function ExpansionSidePanel({
  sites,
  sitesLoading,
  sitesError,
  billboards,
  zones,
  periodMonths,
  activeSiteId,
  onSelectSite,
  onSelectZone,
  onSelectBillboard,
}: {
  sites: ExpansionSite[];
  sitesLoading: boolean;
  sitesError: boolean;
  billboards: MappedBillboard[];
  zones: ZoneSummary[];
  periodMonths: number;
  activeSiteId: string | null;
  onSelectSite: (site: ExpansionSite) => void;
  onSelectZone: (zone: ZoneSummary) => void;
  onSelectBillboard: (billboard: MappedBillboard) => void;
}) {
  const [tab, setTab] = useState("planificadas");

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0 pt-3">
      <TabsList className="mx-3 mb-3 self-stretch">
        <TabsTrigger value="planificadas" className="flex-1 px-2">
          Planificadas
          <span className="text-xs text-muted-foreground tabular-nums">{sites.length}</span>
        </TabsTrigger>
        <TabsTrigger value="zonas" className="flex-1 px-2">
          Zonas
        </TabsTrigger>
        <TabsTrigger value="ranking" className="flex-1 px-2">
          Ranking
        </TabsTrigger>
      </TabsList>

      <TabsContent value="planificadas" className={TAB_CONTENT_CLASS}>
        <ExpansionSitesList
          sites={sites}
          billboards={billboards}
          periodMonths={periodMonths}
          isLoading={sitesLoading}
          isError={sitesError}
          activeId={activeSiteId}
          onSelect={onSelectSite}
        />
      </TabsContent>
      <TabsContent value="zonas" className={TAB_CONTENT_CLASS}>
        <ExpansionZonesList zones={zones} onSelect={onSelectZone} />
      </TabsContent>
      <TabsContent value="ranking" className={TAB_CONTENT_CLASS}>
        <ExpansionRankingList billboards={billboards} onSelect={onSelectBillboard} />
      </TabsContent>
    </Tabs>
  );
}
