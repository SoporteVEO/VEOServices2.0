"use client";

import type { CrmDealDetail } from "@/api/crm/crm.types";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CrmInventoryFilters } from "./crm-inventory-filters";
import { CrmInventoryList } from "./crm-inventory-list";
import { CrmInventorySelectionBar } from "./crm-inventory-selection-bar";
import { initialInventoryFilters } from "./inventory-state";
import { useInventoryBrowser } from "./use-inventory-browser";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: CrmDealDetail;
}

export function CrmInventoryPickerDialog({ open, onOpenChange, deal }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="sm:max-w-5xl lg:max-w-5xl">
        {open ? <PickerBody deal={deal} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({ deal, onDone }: { deal: CrmDealDetail; onDone: () => void }) {
  const browser = useInventoryBrowser({
    initialFilters: () => initialInventoryFilters(deal),
    dealId: deal.id,
    industry: deal.industry,
  });
  const result = browser.inventory.data;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Agregar sitios</DialogTitle>
        <DialogDescription>
          Vallas y pantallas con su disponibilidad real para el periodo
          {deal.industry ? `; se marcan conflictos con otras marcas de ${deal.industry}` : ""}.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <CrmInventoryFilters
          value={browser.filters}
          onChange={browser.patchFilters}
          departments={result?.departments ?? []}
        />
        <CrmInventoryList
          items={result?.items ?? []}
          totals={result?.totals}
          truncated={result?.truncated}
          isLoading={browser.inventory.isLoading}
          selection={browser.selection}
          onToggle={browser.toggle}
          onSpotsChange={browser.setSpots}
        />
      </DialogBody>
      <DialogFooter className="border-t sm:justify-stretch">
        <div className="w-full">
          <CrmInventorySelectionBar
            count={browser.count}
            total={browser.total}
            hold={browser.hold}
            onHoldChange={browser.setHold}
            onClear={browser.clear}
            pending={browser.pending}
            onSubmit={() => browser.submit(deal.id, onDone)}
          />
        </div>
      </DialogFooter>
    </>
  );
}
