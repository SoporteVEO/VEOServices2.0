"use client";

import { useMemo, useRef, useState } from "react";
import { getClient, useClientsInfinite, type Client } from "@/api/clients/clients.get";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export interface ClientComboboxProps {
  value: string | null;
  onChange: (client: Client | null) => void;
  /**
   * Reference for the selected client. Used so the trigger can show the
   * correct label even when the value isn't in the loaded pages (server-side
   * paginated search).
   */
  defaultSelectedClient?: Client | null;
  label?: string;
  required?: boolean;
  triggerClassName?: string;
}

function buildClientLabel(client: Client): string {
  const parts = [client.name];
  if (client.company) parts.push(`(${client.company})`);
  return parts.join(" ");
}

export function ClientCombobox({
  value,
  onChange,
  defaultSelectedClient,
  label,
  required = false,
  triggerClassName,
}: ClientComboboxProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const [lastSelected, setLastSelected] = useState<Client | null>(
    defaultSelectedClient ?? null,
  );

  const query = useClientsInfinite({
    search: debouncedSearch || undefined,
  });

  const clients = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  );

  const clientsByIdRef = useRef(new Map<string, Client>());
  for (const client of clients) {
    clientsByIdRef.current.set(client.id, client);
  }

  const options = useMemo<ComboboxOption[]>(() => {
    return clients.map((client) => ({
      value: client.id,
      label: buildClientLabel(client),
      filterValue: `${client.name} ${client.company ?? ""} ${client.email}`,
    }));
  }, [clients]);

  const selectedOption = useMemo<ComboboxOption | null>(() => {
    if (value == null) return null;
    if (lastSelected && lastSelected.id === value) {
      return {
        value: lastSelected.id,
        label: buildClientLabel(lastSelected),
      };
    }
    return null;
  }, [value, lastSelected]);

  function handleChange(next: string | number | undefined) {
    if (next == null) {
      setLastSelected(null);
      onChange(null);
      return;
    }
    const id = String(next);
    const found =
      clientsByIdRef.current.get(id) ??
      (lastSelected?.id === id ? lastSelected : null);
    if (found) {
      setLastSelected(found);
      onChange(found);
      return;
    }

    void getClient(id)
      .then((client) => {
        clientsByIdRef.current.set(client.id, client);
        setLastSelected(client);
        onChange(client);
      })
      .catch(() => {
        // Ignore invalid selections.
      });
  }

  function handleOpenChange(open: boolean) {
    if (open && search !== "") {
      setSearch("");
    }
  }

  const emptyLabel = debouncedSearch
    ? "No se encontraron clientes."
    : "Aún no hay clientes registrados.";

  return (
    <Combobox
      label={label}
      placeholder="Buscar cliente..."
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
      onLoadMore={query.fetchNextPage}
      selectedOption={selectedOption}
      triggerClassName={triggerClassName}
      required={required}
    />
  );
}
