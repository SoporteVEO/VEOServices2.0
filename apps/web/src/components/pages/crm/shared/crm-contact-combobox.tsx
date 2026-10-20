"use client";

import { useMemo, useState } from "react";
import { useCrmContacts } from "@/api/crm/crm.get";
import type { CrmContact } from "@/api/crm/crm.types";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { personName } from "../crm-format";

type ContactName = { id: string; firstName: string; lastName: string | null };

interface CrmContactComboboxProps {
  value: string | null;
  onChange: (contactId: string | null, contact: CrmContact | null) => void;
  clientId?: string | null;
  /** Label source when the selected contact isn't in the loaded page. */
  selected?: ContactName | null;
  label?: string;
  onAdd?: () => void;
  disabled?: boolean;
}

export function CrmContactCombobox({
  value,
  onChange,
  clientId,
  selected,
  label = "Contacto",
  onAdd,
  disabled,
}: CrmContactComboboxProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const { data, isLoading } = useCrmContacts({
    clientId: clientId ?? undefined,
    search: debouncedSearch || undefined,
    pageSize: 50,
  });
  const contacts = useMemo(() => data?.data ?? [], [data]);

  const options = useMemo<ComboboxOption[]>(
    () =>
      contacts.map((contact) => ({
        value: contact.id,
        label: personName(contact),
        filterValue: `${personName(contact)} ${contact.email ?? ""}`,
        data: contact,
      })),
    [contacts],
  );

  return (
    <Combobox
      label={label}
      placeholder="Sin contacto"
      emptyLabel={clientId ? "Este cliente no tiene contactos." : "Sin contactos."}
      options={options}
      value={value}
      disabled={disabled}
      isLoading={isLoading}
      manualFilter
      onSearch={setSearch}
      selectedOption={
        selected ? { value: selected.id, label: personName(selected) } : null
      }
      renderOption={(option) => {
        const contact = option.data as CrmContact | undefined;
        if (!contact) return option.label;
        const detail = [contact.jobTitle, contact.email].filter(Boolean).join(" · ");
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm">{option.label}</span>
            {detail ? (
              <span className="truncate text-xs text-muted-foreground">{detail}</span>
            ) : null}
          </div>
        );
      }}
      addLabel={onAdd ? "+ Nuevo contacto" : undefined}
      onAdd={onAdd}
      onChange={(next) => {
        if (!next) {
          onChange(null, null);
          return;
        }
        const id = String(next);
        onChange(id, contacts.find((c) => c.id === id) ?? null);
      }}
    />
  );
}
