"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useHrCatalog } from "@/api/hr-catalogs/hr-catalogs.get";
import { useCreateHrCatalogEntry } from "@/api/hr-catalogs/hr-catalogs.mutations";
import type {
  HrCatalogEntry,
  HrCatalogKind,
} from "@/api/hr-catalogs/hr-catalogs.types";
import {
  CreatableCombobox,
  type ComboboxOption,
} from "@/components/ui/combobox";
import { ComboboxEditField } from "@/components/ui/edit-field";

export const HR_CATALOG_LABELS: Record<HrCatalogKind, string> = {
  positions: "Cargo",
  departments: "Área/Gerencia",
};

function useHrCatalogOptions(kind: HrCatalogKind) {
  const { data = [], isLoading } = useHrCatalog(kind);
  const createMutation = useCreateHrCatalogEntry(kind);

  const options: ComboboxOption[] = useMemo(
    () => data.map((entry) => ({ value: entry.id, label: entry.name })),
    [data],
  );

  async function create(name: string) {
    try {
      const entry = await createMutation.mutateAsync(name);
      toast.success(`${HR_CATALOG_LABELS[kind]} «${entry.name}» disponible`);
      return entry.id;
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : `No se pudo crear el ${HR_CATALOG_LABELS[kind].toLowerCase()}`,
      );
      throw err;
    }
  }

  return { options, isLoading, create };
}

function toOption(entry: HrCatalogEntry | null | undefined) {
  return entry ? { value: entry.id, label: entry.name } : null;
}

type HrCatalogComboboxProps = {
  kind: HrCatalogKind;
  value: string | null;
  onChange: (value: string | null) => void;
  required?: boolean;
};

export function HrCatalogCombobox({
  kind,
  value,
  onChange,
  required,
}: HrCatalogComboboxProps) {
  const { options, isLoading, create } = useHrCatalogOptions(kind);

  return (
    <CreatableCombobox
      label={HR_CATALOG_LABELS[kind]}
      placeholder="Selecciona o crea una opción"
      isLoading={isLoading}
      options={options}
      value={value ?? undefined}
      onChange={(v) =>
        onChange(v === undefined || v === null || v === "" ? null : String(v))
      }
      onCreate={create}
      required={required}
    />
  );
}

type HrCatalogEditFieldProps = {
  kind: HrCatalogKind;
  entry: HrCatalogEntry | null;
  isPending: boolean;
  onSubmit: (value: string | null) => Promise<void>;
};

export function HrCatalogEditField({
  kind,
  entry,
  isPending,
  onSubmit,
}: HrCatalogEditFieldProps) {
  const { options, create } = useHrCatalogOptions(kind);

  return (
    <ComboboxEditField
      label={HR_CATALOG_LABELS[kind]}
      required
      initialValue={entry?.id ?? null}
      selectedOption={toOption(entry)}
      options={options}
      placeholder="Selecciona o crea una opción"
      isPending={isPending}
      onSubmit={onSubmit}
      onCreate={create}
    />
  );
}
