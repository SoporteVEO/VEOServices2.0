"use client";

import { useMemo, useState } from "react";
import {
  type StaticBillboardCode,
  useStaticBillboardCodesInfinite,
} from "@/api/static-billboard-codes/static-billboard-codes.get";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CreateStaticBillboardCodeDialog } from "./create-static-billboard-code-dialog";

interface StaticBillboardCodeRef {
  id: string;
  code: string;
}

interface StaticBillboardCodeComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Optional code reference for the initial value, used so the trigger can show the correct label even when the value isn't in the loaded pages. */
  defaultSelectedCode?: StaticBillboardCodeRef | null;
  label?: string;
  triggerClassName?: string;
  required?: boolean;
}

export function StaticBillboardCodeCombobox({
  value,
  onChange,
  defaultSelectedCode,
  label,
  triggerClassName,
  required = false,
}: StaticBillboardCodeComboboxProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const [createOpen, setCreateOpen] = useState(false);
  const [lastSelected, setLastSelected] = useState<StaticBillboardCodeRef | null>(
    defaultSelectedCode ?? null,
  );

  const query = useStaticBillboardCodesInfinite({
    search: debouncedSearch || undefined,
  });

  const options = useMemo<ComboboxOption[]>(() => {
    const codes = query.data?.pages.flatMap((page) => page.data) ?? [];
    return codes.map((code) => ({ value: code.id, label: code.code }));
  }, [query.data]);

  const selectedOption = useMemo<ComboboxOption | null>(() => {
    if (value == null) return null;
    if (lastSelected && lastSelected.id === value) {
      return { value: lastSelected.id, label: lastSelected.code };
    }
    return null;
  }, [value, lastSelected]);

  function handleChange(next: string | number | undefined) {
    if (next == null) {
      onChange(null);
      return;
    }
    const id = String(next);
    const found = options.find((option) => option.value === id);
    if (found && typeof found.label === "string") {
      setLastSelected({ id, code: found.label });
    }
    onChange(id);
  }

  function handleOpenChange(open: boolean) {
    if (open && search !== "") {
      setSearch("");
    }
  }

  function handleCodeCreated(created: StaticBillboardCode) {
    setLastSelected({ id: created.id, code: created.code });
    onChange(created.id);
  }

  const emptyLabel = debouncedSearch
    ? "No se encontraron códigos."
    : "No hay códigos creados.";

  return (
    <>
      <Combobox
        label={label}
        placeholder="Selecciona un código"
        emptyLabel={emptyLabel}
        options={options}
        value={value}
        isLoading={query.isLoading}
        onChange={handleChange}
        addLabel="Crear nuevo código"
        onAdd={() => setCreateOpen(true)}
        onSearch={setSearch}
        onOpenChange={handleOpenChange}
        manualFilter
        hasMore={query.hasNextPage ?? false}
        isLoadingMore={query.isFetchingNextPage}
        onLoadMore={query.fetchNextPage}
        selectedOption={selectedOption}
        triggerClassName={triggerClassName}
        required={required}
      />

      <CreateStaticBillboardCodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCodeCreated}
      />
    </>
  );
}
