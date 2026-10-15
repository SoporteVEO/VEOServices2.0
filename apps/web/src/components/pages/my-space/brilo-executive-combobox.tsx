"use client";

import { useMemo } from "react";
import type { BriloExecutiveOption } from "@/api/offers/offers.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

type BriloExecutiveComboboxProps = {
  executives: BriloExecutiveOption[];
  value: number | null;
  onChange: (ejecId: number | null) => void;
  /** Executives whose name matches the advisor; listed first. */
  matchIds?: number[];
};

export function BriloExecutiveCombobox({
  executives,
  value,
  onChange,
  matchIds = [],
}: BriloExecutiveComboboxProps) {
  const options = useMemo<ComboboxOption[]>(() => {
    const matched = new Set(matchIds);
    return [...executives]
      .sort((a, b) => Number(matched.has(b.ejecId)) - Number(matched.has(a.ejecId)))
      .map((executive) => ({
        value: executive.ejecId,
        label: executive.ejecNombre,
        filterValue: `${executive.ejecNombre} ${executive.ejecCodigo ?? ""}`,
      }));
  }, [executives, matchIds]);

  return (
    <Combobox
      label="Ejecutivo Brilo"
      placeholder="Buscar ejecutivo..."
      emptyLabel="No se encontraron ejecutivos."
      options={options}
      value={value}
      onChange={(next) => onChange(next == null ? null : Number(next))}
      preserveOptionOrder
      required
    />
  );
}
