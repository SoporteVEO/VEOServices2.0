"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCrmInventory } from "@/api/crm/crm-ooh.get";
import { useAddCrmDealSites } from "@/api/crm/crm-ooh.mutations";
import type { InventoryItem } from "@/api/crm/crm-ooh.types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { errorMessage } from "../crm-format";
import { isoDay } from "../crm-ooh-format";
import type { HoldOptions } from "./crm-inventory-selection-bar";
import {
  inventoryQuery,
  selectionToSites,
  selectionTotal,
  toggleSelection,
  type InventoryFilters,
  type InventorySelection,
} from "./inventory-state";

interface Options {
  initialFilters: () => InventoryFilters;
  dealId?: string | null;
  industry?: string | null;
  enabled?: boolean;
}

export function useInventoryBrowser({ initialFilters, dealId, industry, enabled = true }: Options) {
  const [filters, setFilters] = useState<InventoryFilters>(initialFilters);
  const [selection, setSelection] = useState<InventorySelection>({});
  const [hold, setHold] = useState<HoldOptions>({ hold: true, holdDays: 7 });
  const debouncedSearch = useDebouncedValue(filters.search.trim(), 300);
  const addSites = useAddCrmDealSites();

  const inventory = useCrmInventory(
    inventoryQuery(filters, debouncedSearch, {
      dealId: dealId ?? undefined,
      industry: industry ?? undefined,
    }),
    enabled,
  );

  const count = Object.keys(selection).length;
  const total = filters.from && filters.to ? selectionTotal(selection, filters.from, filters.to) : 0;

  function patchFilters(patch: Partial<InventoryFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function toggle(item: InventoryItem) {
    setSelection((prev) => toggleSelection(prev, item));
  }

  function setSpots(key: string, spotsPerDay: number) {
    setSelection((prev) =>
      prev[key] ? { ...prev, [key]: { ...prev[key], spotsPerDay } } : prev,
    );
  }

  function submit(targetDealId: string | null | undefined, onDone?: () => void) {
    if (!targetDealId) {
      toast.error("Selecciona un negocio.");
      return;
    }
    if (!filters.from || !filters.to) {
      toast.error("Selecciona el periodo de exhibición.");
      return;
    }
    addSites.mutate(
      {
        dealId: targetDealId,
        sites: selectionToSites(selection),
        startDate: isoDay(filters.from),
        endDate: isoDay(filters.to),
        hold: hold.hold,
        holdDays: hold.holdDays,
      },
      {
        onSuccess: (result) => {
          setSelection({});
          toast.success(
            result.added === 1 ? "1 sitio agregado" : `${result.added} sitios agregados`,
          );
          for (const warning of result.warnings) toast.warning(warning);
          onDone?.();
        },
        onError: (error) => toast.error(errorMessage(error, "No se pudieron agregar los sitios.")),
      },
    );
  }

  return {
    filters,
    patchFilters,
    inventory,
    selection,
    toggle,
    setSpots,
    clear: () => setSelection({}),
    hold,
    setHold,
    count,
    total,
    submit,
    pending: addSites.isPending,
  };
}
