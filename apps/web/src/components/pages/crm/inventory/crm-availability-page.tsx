"use client";

import { useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { useCrmDeal } from "@/api/crm/crm.get";
import type { InventoryItem } from "@/api/crm/crm-ooh.types";
import type { MapRef } from "@/components/primitives/ui/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AskNexoButton } from "@/components/dashboard/agent/ask-nexo-button";
import { AGENT_NAME } from "@/lib/agent-brand";
import { dealProposalPrompt } from "../crm-nexo-prompts";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmDealCombobox } from "../shared/crm-deal-combobox";
import { CrmInventoryFilters } from "./crm-inventory-filters";
import { CrmInventoryList } from "./crm-inventory-list";
import { CrmInventoryMap } from "./crm-inventory-map";
import { CrmInventorySelectionBar } from "./crm-inventory-selection-bar";
import { inventoryRowId, isMappable } from "./inventory-format";
import { initialInventoryFilters } from "./inventory-state";
import { useInventoryBrowser } from "./use-inventory-browser";

type DealRef = { id: string; title: string };

const LOCATE_ZOOM = 15;

export function CrmAvailabilityPage() {
  const [target, setTarget] = useState<DealRef | null>(null);
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const mapRef = useRef<MapRef>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { data: targetDeal } = useCrmDeal(target?.id ?? null);
  const browser = useInventoryBrowser({
    initialFilters: () => initialInventoryFilters(),
    dealId: target?.id,
    industry: targetDeal?.industry,
  });
  const result = browser.inventory.data;

  function locate(item: InventoryItem) {
    setActiveKey(item.key);
    const map = mapRef.current;
    if (!map || !isMappable(item)) return;
    map.flyTo({
      center: [item.longitude, item.latitude],
      zoom: Math.max(map.getZoom(), LOCATE_ZOOM),
    });
  }

  function activateFromMap(key: string | null) {
    setActiveKey(key);
    const list = listRef.current;
    const row = key ? document.getElementById(inventoryRowId(key)) : null;
    if (!list || !row) return;
    const listRect = list.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    if (rowRect.top < listRect.top || rowRect.bottom > listRect.bottom) {
      list.scrollBy({ top: rowRect.top - listRect.top - listRect.height / 3, behavior: "smooth" });
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <CrmInventoryFilters
            value={browser.filters}
            onChange={browser.patchFilters}
            departments={result?.departments ?? []}
          />
        </CardContent>
      </Card>

      <Card className="sticky top-0 z-20 lg:static">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-80">
              <CrmDealCombobox
                label="Agregar al negocio"
                value={target?.id ?? null}
                selected={target}
                onChange={setTarget}
              />
            </div>
            {target ? (
              <Button
                variant="ghost"
                sizeVariant="sm"
                icon={ExternalLink}
                onClick={() => setOpenDealId(target.id)}
              >
                Abrir negocio
              </Button>
            ) : null}
            {targetDeal ? (
              <AskNexoButton
                sizeVariant="sm"
                label="Sugerir sitios"
                hint={`${AGENT_NAME} elige las vallas ideales para este negocio y arma la propuesta`}
                prompt={dealProposalPrompt(targetDeal)}
              />
            ) : null}
            {targetDeal?.industry ? (
              <span className="pb-2 text-xs text-muted-foreground">
                Revisando conflictos de {targetDeal.industry}
              </span>
            ) : null}
          </div>
          <CrmInventorySelectionBar
            count={browser.count}
            total={browser.total}
            onClear={browser.clear}
            pending={browser.pending}
            disabled={!target}
            onSubmit={() => browser.submit(target?.id)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:h-[max(520px,calc(100svh-27rem))] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:grid-rows-[minmax(0,1fr)]">
        <div ref={listRef} className="min-h-0 lg:overflow-y-auto lg:pe-1">
          <CrmInventoryList
            items={result?.items ?? []}
            totals={result?.totals}
            truncated={result?.truncated}
            isLoading={browser.inventory.isLoading}
            selection={browser.selection}
            onToggle={browser.toggle}
            onSpotsChange={browser.setSpots}
            activeKey={activeKey}
            onLocate={locate}
          />
        </div>
        <Card className="order-first h-[420px] overflow-hidden p-0 lg:order-none lg:h-auto">
          <CrmInventoryMap
            ref={mapRef}
            items={result?.items ?? []}
            isLoading={browser.inventory.isLoading}
            selection={browser.selection}
            activeKey={activeKey}
            onActiveChange={activateFromMap}
            onToggle={browser.toggle}
          />
        </Card>
      </div>

      <CrmDealDrawer
        dealId={openDealId}
        onOpenChange={(open) => {
          if (!open) setOpenDealId(null);
        }}
      />
    </section>
  );
}
