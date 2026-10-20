"use client";

import { useMemo, useState } from "react";
import { useBriloClientsInfinite } from "@/api/offers/offers.get";
import type { BriloClientOption } from "@/api/offers/offers.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

type BriloClientComboboxProps = {
  value: BriloClientOption | null;
  onChange: (client: BriloClientOption | null) => void;
  /** Shown before the user types, e.g. the clients matched by email. */
  suggestions?: BriloClientOption[];
  label?: string;
  required?: boolean;
  className?: string;
};

function toComboboxOption(client: BriloClientOption): ComboboxOption {
  return {
    value: client.cliId,
    label: client.name,
    filterValue: [client.name, client.commercialName, client.cliNumero]
      .filter(Boolean)
      .join(" "),
    data: client,
  };
}

function BriloClientOptionCard({
  client,
  compact = false,
}: {
  client: BriloClientOption;
  compact?: boolean;
}) {
  const meta = [client.cliNumero, client.nit, client.email]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className={cn("flex min-w-0 flex-col text-left", !compact && "gap-0.5")}>
      <span className="truncate text-sm font-semibold text-foreground group-hover/button:text-background">
        {client.name || "Sin nombre"}
      </span>
      {client.commercialName && client.commercialName !== client.name ? (
        <span className="truncate text-xs text-foreground/90 group-hover/button:text-background/90">
          {client.commercialName}
        </span>
      ) : null}
      {meta ? (
        <span className="truncate text-xs text-muted-foreground group-hover/button:text-background/70">
          {meta}
        </span>
      ) : null}
    </div>
  );
}

export function BriloClientCombobox({
  value,
  onChange,
  suggestions = [],
  label = "Cliente Brilo",
  required = true,
  className,
}: BriloClientComboboxProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const query = useBriloClientsInfinite({
    search: debouncedSearch || undefined,
  });

  const clients = useMemo(() => {
    const fetched = query.data?.pages.flatMap((page) => page.data) ?? [];
    if (debouncedSearch) return fetched;
    const suggestedIds = new Set(suggestions.map((c) => c.cliId));
    return [...suggestions, ...fetched.filter((c) => !suggestedIds.has(c.cliId))];
  }, [query.data, suggestions, debouncedSearch]);

  const options = useMemo(() => clients.map(toComboboxOption), [clients]);

  function handleChange(next: string | number | undefined) {
    if (next == null) {
      onChange(null);
      return;
    }
    const found = clients.find((c) => c.cliId === Number(next));
    if (found) onChange(found);
  }

  function handleOpenChange(open: boolean) {
    if (open && search !== "") setSearch("");
  }

  return (
    <Combobox
      label={label}
      className={className}
      placeholder="Buscar por nombre, código, NIT o correo..."
      emptyLabel={
        debouncedSearch
          ? "No se encontraron clientes."
          : "Escribe para buscar clientes de Brilo."
      }
      options={options}
      value={value?.cliId ?? null}
      isLoading={query.isLoading}
      onChange={handleChange}
      onSearch={setSearch}
      onOpenChange={handleOpenChange}
      manualFilter
      preserveOptionOrder
      hasMore={query.hasNextPage ?? false}
      isLoadingMore={query.isFetchingNextPage}
      onLoadMore={() => void query.fetchNextPage()}
      selectedOption={value ? toComboboxOption(value) : null}
      renderOption={(option) => (
        <BriloClientOptionCard client={option.data as BriloClientOption} />
      )}
      renderValue={(option) => (
        <BriloClientOptionCard
          client={option.data as BriloClientOption}
          compact
        />
      )}
      required={required}
    />
  );
}
