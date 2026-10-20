"use client";

import { useMemo, useState } from "react";
import type { ReportRecipient } from "@/api/clients/clients.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type OptionData =
  | { kind: "contact"; contact: ReportRecipient }
  | { kind: "fallback" }
  | { kind: "custom" };

interface ReportRecipientComboboxProps {
  label?: string;
  value: string;
  onChange: (email: string) => void;
  contacts: ReportRecipient[];
  /** Email stored for the customer in Brilo, offered when no contact has it. */
  fallbackEmail?: string | null;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ReportRecipientCombobox({
  label,
  value,
  onChange,
  contacts,
  fallbackEmail,
  isLoading,
  disabled,
}: ReportRecipientComboboxProps) {
  const [search, setSearch] = useState("");

  const options = useMemo<ComboboxOption[]>(() => {
    const seen = new Set<string>();
    const list: ComboboxOption[] = [];
    for (const contact of contacts) {
      if (seen.has(contact.email)) continue;
      seen.add(contact.email);
      list.push({
        value: contact.email,
        label: `${contact.name} · ${contact.email}`,
        filterValue: `${contact.name} ${contact.jobTitle ?? ""} ${contact.email}`,
        data: { kind: "contact", contact } satisfies OptionData,
      });
    }
    const fallback = fallbackEmail?.trim().toLowerCase();
    if (fallback && EMAIL_REGEX.test(fallback) && !seen.has(fallback)) {
      seen.add(fallback);
      list.push({
        value: fallback,
        label: fallback,
        filterValue: `correo del cliente en brilo ${fallback}`,
        data: { kind: "fallback" } satisfies OptionData,
      });
    }
    const typed = search.trim().toLowerCase();
    if (EMAIL_REGEX.test(typed) && !seen.has(typed)) {
      seen.add(typed);
      list.push({
        value: typed,
        label: typed,
        filterValue: typed,
        data: { kind: "custom" } satisfies OptionData,
      });
    }
    return list;
  }, [contacts, fallbackEmail, search]);

  const selectedOption = useMemo<ComboboxOption | null>(
    () => (value ? { value, label: value } : null),
    [value],
  );

  return (
    <Combobox
      label={label}
      required
      placeholder="Buscar contacto o escribir un correo..."
      emptyLabel="Escribe un correo completo para usarlo."
      options={options}
      value={value || null}
      isLoading={isLoading}
      disabled={disabled}
      preserveOptionOrder
      selectedOption={selectedOption}
      onSearch={setSearch}
      onOpenChange={(open) => {
        if (open) setSearch("");
      }}
      renderOption={(option) => {
        const data = option.data as OptionData | undefined;
        if (data?.kind === "contact") {
          const { contact } = data;
          return (
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-2 truncate text-sm">
                {contact.name}
                {contact.isPrimary ? (
                  <Badge variant="secondary">Principal</Badge>
                ) : null}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {[contact.jobTitle, contact.email].filter(Boolean).join(" · ")}
              </span>
            </div>
          );
        }
        return (
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm">
              {data?.kind === "custom"
                ? "Usar este correo"
                : "Correo del cliente en Brilo"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {option.label}
            </span>
          </div>
        );
      }}
      onChange={(next) => {
        if (next) onChange(String(next));
      }}
    />
  );
}
