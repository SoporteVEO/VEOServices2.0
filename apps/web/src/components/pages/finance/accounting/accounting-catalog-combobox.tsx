"use client";

import { useMemo, useState } from "react";
import { useAccounts, useCostCenters } from "@/api/finance/accounting.get";
import type { CatalogQuery } from "@/api/finance/finance.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface CatalogSelection {
  code: string;
  name: string | null;
}

function searchQuery(search: string): CatalogQuery {
  const isCode = /^[\d.-]+$/.test(search);
  return {
    code: isCode ? search : undefined,
    name: !isCode && search ? search : undefined,
    pageSize: 50,
  };
}

function toOption(item: CatalogSelection): ComboboxOption {
  return {
    value: item.code,
    label: item.name ? `${item.code} · ${item.name}` : item.code,
    filterValue: `${item.code} ${item.name ?? ""}`,
  };
}

type Props = {
  label: string;
  value: CatalogSelection | null;
  onChange: (value: CatalogSelection | null) => void;
  required?: boolean;
};

function CatalogCombobox({
  label,
  value,
  onChange,
  required,
  items,
  isLoading,
  onSearch,
}: Props & {
  items: CatalogSelection[];
  isLoading: boolean;
  onSearch: (search: string) => void;
}) {
  const options = useMemo(() => items.map(toOption), [items]);
  return (
    <Combobox
      label={label}
      required={required}
      placeholder="Buscar por código o nombre..."
      emptyLabel="Sin resultados."
      options={options}
      value={value?.code ?? null}
      isLoading={isLoading}
      onSearch={onSearch}
      manualFilter
      preserveOptionOrder
      selectedOption={value ? toOption(value) : null}
      onChange={(next) => {
        if (next == null) return onChange(null);
        onChange(items.find((item) => item.code === String(next)) ?? null);
      }}
    />
  );
}

export function AccountCombobox(props: Props) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 250);
  const { data, isLoading } = useAccounts(searchQuery(debounced));
  const items = useMemo(
    () =>
      (data?.data ?? [])
        .filter((account) => account.cueCodigo && account.cueDetalle !== false)
        .map((account) => ({
          code: account.cueCodigo as string,
          name: account.cueNombre,
        })),
    [data],
  );
  return (
    <CatalogCombobox
      {...props}
      items={items}
      isLoading={isLoading}
      onSearch={setSearch}
    />
  );
}

export function CostCenterCombobox(props: Props) {
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 250);
  const { data, isLoading } = useCostCenters(searchQuery(debounced));
  const items = useMemo(
    () =>
      (data?.data ?? [])
        .filter((center) => center.cecoCodigo && center.cecoActivo !== false)
        .map((center) => ({
          code: center.cecoCodigo as string,
          name: center.cecoNombre,
        })),
    [data],
  );
  return (
    <CatalogCombobox
      {...props}
      items={items}
      isLoading={isLoading}
      onSearch={setSearch}
    />
  );
}
