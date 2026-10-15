"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { useCrmDeal } from "@/api/crm/crm.get";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmDealCombobox } from "../shared/crm-deal-combobox";
import { CrmInventoryFilters } from "./crm-inventory-filters";
import { CrmInventoryList } from "./crm-inventory-list";
import { CrmInventorySelectionBar } from "./crm-inventory-selection-bar";
import { initialInventoryFilters } from "./inventory-state";
import { useInventoryBrowser } from "./use-inventory-browser";

type DealRef = { id: string; title: string };

export function CrmAvailabilityPage() {
  const [target, setTarget] = useState<DealRef | null>(null);
  const [openDealId, setOpenDealId] = useState<string | null>(null);
  const { data: targetDeal } = useCrmDeal(target?.id ?? null);
  const browser = useInventoryBrowser({
    initialFilters: () => initialInventoryFilters(),
    dealId: target?.id,
    industry: targetDeal?.industry,
  });
  const result = browser.inventory.data;

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

      <Card className="sticky top-0 z-10">
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
            {targetDeal?.industry ? (
              <span className="pb-2 text-xs text-muted-foreground">
                Revisando conflictos de {targetDeal.industry}
              </span>
            ) : null}
          </div>
          <CrmInventorySelectionBar
            count={browser.count}
            total={browser.total}
            hold={browser.hold}
            onHoldChange={browser.setHold}
            onClear={browser.clear}
            pending={browser.pending}
            disabled={!target}
            onSubmit={() => browser.submit(target?.id)}
          />
        </CardContent>
      </Card>

      <CrmInventoryList
        items={result?.items ?? []}
        totals={result?.totals}
        truncated={result?.truncated}
        isLoading={browser.inventory.isLoading}
        selection={browser.selection}
        onToggle={browser.toggle}
        onSpotsChange={browser.setSpots}
      />

      <CrmDealDrawer
        dealId={openDealId}
        onOpenChange={(open) => {
          if (!open) setOpenDealId(null);
        }}
      />
    </section>
  );
}
