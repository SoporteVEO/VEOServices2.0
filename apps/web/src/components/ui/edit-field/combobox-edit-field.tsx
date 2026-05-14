"use client";

import { useState } from "react";
import {
  Editable,
  EditableArea,
} from "@/components/primitives/ui/editable";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  EditFieldPreview,
  EditFieldShell,
  EditFieldToolbar,
} from "./edit-field-shell";

export type ComboboxEditFieldProps = {
  label: string;
  initialValue: string | null;
  options: ComboboxOption[];
  selectedOption?: ComboboxOption | null;
  emptyText?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  isPending: boolean;
  onSubmit: (value: string | null) => Promise<void>;
};

export function ComboboxEditField({
  label,
  initialValue,
  options,
  selectedOption,
  emptyText = "Sin asignar",
  description,
  placeholder = "Selecciona una opción",
  required,
  isPending,
  onSubmit,
}: ComboboxEditFieldProps) {
  const [draft, setDraft] = useState<string | null>(initialValue);
  const [editing, setEditing] = useState(false);

  function handleSubmit() {
    if ((draft ?? null) === (initialValue ?? null)) {
      setEditing(false);
      return;
    }
    onSubmit(draft)
      .then(() => setEditing(false))
      .catch(() => {});
  }

  function handleCancel() {
    setDraft(initialValue);
    setEditing(false);
  }

  const displayOption = options.find((o) => o.value === initialValue);
  const displayNode = displayOption?.label ?? selectedOption?.label ?? null;

  return (
    <EditFieldShell label={label} required={required} description={description}>
      <Editable
        value={draft ?? ""}
        editing={editing}
        onEditingChange={setEditing}
        onEdit={() => setDraft(initialValue)}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        disabled={isPending}
      >
        <EditableArea className="block w-full">
          {editing ? (
            <div className="flex flex-col gap-2">
              <Combobox
                options={options}
                value={draft ?? undefined}
                selectedOption={selectedOption}
                onChange={(v) =>
                  setDraft(
                    v === undefined || v === null || v === ""
                      ? null
                      : String(v),
                  )
                }
                placeholder={placeholder}
                disabled={isPending}
                required={required}
              />
              <EditFieldToolbar isPending={isPending} />
            </div>
          ) : (
            <EditFieldPreview empty={!displayNode}>
              {displayNode ?? emptyText}
            </EditFieldPreview>
          )}
        </EditableArea>
      </Editable>
    </EditFieldShell>
  );
}
