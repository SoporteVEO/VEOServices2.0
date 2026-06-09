"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { useAvailableBillboardsInRange } from "@/api/billboards/billboards.get";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { toYYYYMMDD } from "@/lib/format";

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setDate(to.getDate() + 60);
  return { from: toYYYYMMDD(now), to: toYYYYMMDD(to) };
}

export interface StaticBillboardPickerProps {
  selectedIds: Set<number>;
  onSelect: (billboard: AvailableBillboardListing) => void;
}

export function StaticBillboardPicker({
  selectedIds,
  onSelect,
}: StaticBillboardPickerProps) {
  const [range] = useState(defaultRange);
  const { data: billboards = [], isLoading } = useAvailableBillboardsInRange({
    from: range.from,
    to: range.to,
    includeUnavailable: true,
  });

  const options = useMemo<ComboboxOption[]>(() => {
    return billboards
      .filter((b) => !selectedIds.has(b.billboardId))
      .map((b) => {
        const subtitleParts = [b.cityName, b.departmentName].filter(Boolean);
        const subtitle = subtitleParts.join(", ");
        return {
          value: b.billboardId,
          label: (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {b.billboardCode ?? `#${b.billboardId}`}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {b.address ?? "—"}
                {subtitle ? ` · ${subtitle}` : ""}
              </span>
            </div>
          ),
          filterValue: `${b.billboardCode ?? ""} ${b.address ?? ""} ${b.cityName ?? ""} ${b.departmentName ?? ""}`,
          data: b,
        };
      });
  }, [billboards, selectedIds]);

  function handleChange(value: string | number | undefined) {
    if (value == null) return;
    const id = Number(value);
    const billboard = billboards.find((b) => b.billboardId === id);
    if (billboard) onSelect(billboard);
  }

  return (
    <Combobox
      placeholder="Agregar valla estática..."
      emptyLabel={
        isLoading ? "Cargando vallas..." : "No hay más vallas disponibles."
      }
      options={options}
      value={null}
      onChange={handleChange}
      isLoading={isLoading}
      leadingIcon={<Plus className="size-4" />}
    />
  );
}
