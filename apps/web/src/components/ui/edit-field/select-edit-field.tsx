"use client";

import { useState } from "react";
import {
  Editable,
  EditableArea,
} from "@/components/primitives/ui/editable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EditFieldPreview,
  EditFieldShell,
  EditFieldToolbar,
} from "./edit-field-shell";

export type SelectEditFieldOption = {
  value: string;
  label: string;
};

export type SelectEditFieldProps = {
  label: string;
  initialValue: string;
  options: SelectEditFieldOption[];
  description?: string;
  required?: boolean;
  emptyText?: string;
  isPending: boolean;
  onSubmit: (value: string) => Promise<void>;
};

export function SelectEditField({
  label,
  initialValue,
  options,
  description,
  required,
  emptyText = "—",
  isPending,
  onSubmit,
}: SelectEditFieldProps) {
  const [draft, setDraft] = useState(initialValue);
  const [editing, setEditing] = useState(false);

  function handleSubmit() {
    if (draft === initialValue) {
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

  const displayLabel = options.find((o) => o.value === initialValue)?.label;

  return (
    <EditFieldShell label={label} required={required} description={description}>
      <Editable
        value={draft}
        onValueChange={setDraft}
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
              <Select value={draft} onValueChange={setDraft}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <EditFieldToolbar isPending={isPending} />
            </div>
          ) : (
            <EditFieldPreview empty={!displayLabel}>
              {displayLabel ?? emptyText}
            </EditFieldPreview>
          )}
        </EditableArea>
      </Editable>
    </EditFieldShell>
  );
}
