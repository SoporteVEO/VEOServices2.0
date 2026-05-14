"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Editable,
  EditableArea,
} from "@/components/primitives/ui/editable";
import { Input as PrimitiveInput } from "@/components/primitives/ui/input";
import {
  EditFieldPreview,
  EditFieldShell,
  EditFieldToolbar,
} from "./edit-field-shell";

export type TextEditFieldProps = {
  label: string;
  initialValue: string | null;
  required?: boolean;
  type?: "text" | "email" | "tel";
  placeholder?: string;
  emptyText?: string;
  description?: string;
  isPending: boolean;
  onSubmit: (value: string | null) => Promise<void>;
  validate?: (value: string) => string | null;
};

export function TextEditField({
  label,
  initialValue,
  required,
  type = "text",
  placeholder = "Sin valor",
  emptyText = "—",
  description,
  isPending,
  onSubmit,
  validate,
}: TextEditFieldProps) {
  const normalized = initialValue ?? "";
  const [draft, setDraft] = useState(normalized);
  const [editing, setEditing] = useState(false);

  function handleSubmit() {
    const trimmed = draft.trim();

    if (required && !trimmed) {
      toast.error(`${label} no puede estar vacío`);
      return;
    }
    if (validate) {
      const err = validate(trimmed);
      if (err) {
        toast.error(err);
        return;
      }
    }
    if (trimmed === normalized.trim()) {
      setEditing(false);
      return;
    }

    const payload = required ? trimmed : trimmed || null;
    onSubmit(payload)
      .then(() => setEditing(false))
      .catch(() => {});
  }

  function handleCancel() {
    setDraft(normalized);
    setEditing(false);
  }

  return (
    <EditFieldShell label={label} required={required} description={description}>
      <Editable
        value={draft}
        onValueChange={setDraft}
        editing={editing}
        onEditingChange={setEditing}
        onEdit={() => setDraft(normalized)}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        disabled={isPending}
      >
        <EditableArea className="block w-full">
          {editing ? (
            <div className="flex flex-col gap-2">
              <PrimitiveInput
                type={type}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                disabled={isPending}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancel();
                  }
                }}
              />
              <EditFieldToolbar isPending={isPending} />
            </div>
          ) : (
            <EditFieldPreview empty={!normalized}>
              {normalized || emptyText}
            </EditFieldPreview>
          )}
        </EditableArea>
      </Editable>
    </EditFieldShell>
  );
}
