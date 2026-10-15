"use client";

import { useMemo, useState } from "react";
import { useCrmDeals } from "@/api/crm/crm.get";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney } from "@/lib/format";
import { clientLabel } from "../crm-format";

type DealRef = { id: string; title: string };

interface CrmDealComboboxProps {
  value: string | null;
  onChange: (deal: DealRef | null) => void;
  selected?: DealRef | null;
  label?: string;
}

export function CrmDealCombobox({
  value,
  onChange,
  selected,
  label = "Negocio",
}: CrmDealComboboxProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const { data: deals = [], isLoading } = useCrmDeals({
    status: "OPEN",
    search: debouncedSearch || undefined,
  });

  const options = useMemo<ComboboxOption[]>(
    () =>
      deals.map((deal) => ({
        value: deal.id,
        label: deal.title,
        filterValue: deal.title,
        data: deal,
      })),
    [deals],
  );

  return (
    <Combobox
      label={label}
      placeholder="Sin negocio"
      emptyLabel="No hay negocios abiertos."
      options={options}
      value={value}
      isLoading={isLoading}
      manualFilter
      onSearch={setSearch}
      selectedOption={selected ? { value: selected.id, label: selected.title } : null}
      renderOption={(option) => {
        const deal = deals.find((d) => d.id === option.value);
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{option.label}</span>
            {deal ? (
              <span className="truncate text-xs text-muted-foreground">
                {[clientLabel(deal.client), deal.stage.name, formatMoney(deal.value)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : null}
          </div>
        );
      }}
      onChange={(next) => {
        if (!next) {
          onChange(null);
          return;
        }
        const deal = deals.find((d) => d.id === next);
        onChange(deal ? { id: deal.id, title: deal.title } : null);
      }}
    />
  );
}
