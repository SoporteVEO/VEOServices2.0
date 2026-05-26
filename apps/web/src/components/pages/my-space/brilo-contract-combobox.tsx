"use client";

import { useMemo, useState } from "react";
import { useBriloContractsInfinite } from "@/api/offers/offers.get";
import type { BriloContractOption } from "@/api/offers/offers.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { BriloContractOptionCard } from "./brilo-contract-option-card";

export interface BriloContractComboboxProps {
  value: number | null;
  onChange: (contract: BriloContractOption | null) => void;
  defaultSelectedContract?: BriloContractOption | null;
  label?: string;
  required?: boolean;
}

function toComboboxOption(contract: BriloContractOption): ComboboxOption {
  return {
    value: contract.mconId,
    label: contract.mconCodigo,
    filterValue: `${contract.mconCodigo} ${contract.ejecNombre ?? ""}`,
    data: contract,
  };
}

export function BriloContractCombobox({
  value,
  onChange,
  defaultSelectedContract,
  label = "Contrato Brilo",
  required = false,
}: BriloContractComboboxProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const [lastSelected, setLastSelected] = useState<BriloContractOption | null>(
    defaultSelectedContract ?? null,
  );

  const query = useBriloContractsInfinite({
    search: debouncedSearch || undefined,
  });

  const contracts = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const options = useMemo<ComboboxOption[]>(() => {
    return contracts.map((contract) => toComboboxOption(contract));
  }, [contracts]);

  const selectedOption = useMemo<ComboboxOption | null>(() => {
    if (value == null) return null;
    const found =
      contracts.find((c) => c.mconId === value) ??
      (lastSelected?.mconId === value ? lastSelected : null);
    if (!found) return null;
    return toComboboxOption(found);
  }, [value, contracts, lastSelected]);

  function renderContractOption(option: ComboboxOption) {
    const contract = option.data as BriloContractOption | undefined;
    if (!contract) return option.label;
    return <BriloContractOptionCard contract={contract} />;
  }

  function renderContractValue(option: ComboboxOption) {
    const contract = option.data as BriloContractOption | undefined;
    if (!contract) return option.label;
    return <BriloContractOptionCard contract={contract} compact />;
  }

  function handleChange(next: string | number | undefined) {
    if (next == null) {
      setLastSelected(null);
      onChange(null);
      return;
    }
    const mconId = Number(next);
    const found = contracts.find((c) => c.mconId === mconId) ?? null;
    if (found) {
      setLastSelected(found);
      onChange(found);
    }
  }

  function handleOpenChange(open: boolean) {
    if (open && search !== "") {
      setSearch("");
    }
  }

  const emptyLabel = debouncedSearch
    ? "No se encontraron contratos."
    : "Escribe para buscar por código o ejecutivo.";

  return (
    <Combobox
      label={label}
      placeholder="Buscar por CON... o ejecutivo..."
      emptyLabel={emptyLabel}
      options={options}
      value={value}
      isLoading={query.isLoading}
      onChange={handleChange}
      onSearch={setSearch}
      onOpenChange={handleOpenChange}
      manualFilter
      hasMore={query.hasNextPage ?? false}
      isLoadingMore={query.isFetchingNextPage}
      onLoadMore={() => void query.fetchNextPage()}
      selectedOption={selectedOption}
      renderOption={renderContractOption}
      renderValue={renderContractValue}
      required={required}
    />
  );
}
