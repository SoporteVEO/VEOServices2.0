"use client";

import { useMemo, useState } from "react";
import { useProductionOrders } from "@/api/production-orders/production-orders.get";
import type { ProductionOrder } from "@/api/production-orders/production-orders.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const PAGE_SIZE = 20;

type Props = {
  value: ProductionOrder | null;
  onChange: (order: ProductionOrder | null) => void;
  disabled?: boolean;
};

export function ProductionOrderCombobox({ value, onChange, disabled }: Props) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const { data, isLoading } = useProductionOrders("all", {
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });
  const orders = useMemo(() => data?.data ?? [], [data]);

  const options = useMemo<ComboboxOption[]>(
    () =>
      orders.map((order) => ({
        value: order.id,
        label: order.orderNumber,
        filterValue: order.orderNumber,
      })),
    [orders],
  );

  return (
    <Combobox
      label="Orden de producción"
      required
      placeholder="Buscar orden, cliente o valla..."
      emptyLabel="No se encontraron órdenes."
      options={options}
      value={value?.id ?? null}
      isLoading={isLoading}
      disabled={disabled}
      manualFilter
      onSearch={setSearch}
      selectedOption={
        value ? { value: value.id, label: value.orderNumber } : null
      }
      renderOption={(option) => {
        const order = orders.find((candidate) => candidate.id === option.value);
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{option.label}</span>
            {order ? (
              <span className="truncate text-xs text-muted-foreground">
                {order.customerCompany ?? order.customerName} ·{" "}
                {order.itemCount} {order.itemCount === 1 ? "valla" : "vallas"}
              </span>
            ) : null}
          </div>
        );
      }}
      onChange={(next) => {
        onChange(orders.find((order) => order.id === next) ?? null);
      }}
    />
  );
}
