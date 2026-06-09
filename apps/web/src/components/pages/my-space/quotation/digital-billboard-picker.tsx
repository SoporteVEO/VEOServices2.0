"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import {
  useDigitalBillboards,
  type DigitalBillboard,
} from "@/api/digital-billboards/digital-billboards.get";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

export interface DigitalBillboardPickerProps {
  selectedIds: Set<string>;
  onSelect: (billboard: DigitalBillboard) => void;
}

export function DigitalBillboardPicker({
  selectedIds,
  onSelect,
}: DigitalBillboardPickerProps) {
  const { data: billboards = [], isLoading } = useDigitalBillboards();

  const options = useMemo<ComboboxOption[]>(() => {
    return billboards
      .filter((b) => !selectedIds.has(b.id))
      .map((b) => ({
        value: b.id,
        label: (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">
              {b.code} · {b.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {b.address || "—"}
            </span>
          </div>
        ),
        filterValue: `${b.code} ${b.name} ${b.address}`,
      }));
  }, [billboards, selectedIds]);

  function handleChange(value: string | number | undefined) {
    if (value == null) return;
    const id = String(value);
    const billboard = billboards.find((b) => b.id === id);
    if (billboard) onSelect(billboard);
  }

  return (
    <Combobox
      placeholder="Agregar valla digital..."
      emptyLabel={
        isLoading
          ? "Cargando vallas digitales..."
          : "No hay más vallas digitales disponibles."
      }
      options={options}
      value={null}
      onChange={handleChange}
      isLoading={isLoading}
      leadingIcon={<Plus className="size-4" />}
    />
  );
}
