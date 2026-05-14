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

export type NumberEditFieldProps = {
  label: string;
  initialValue: number;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  display?: (value: number) => React.ReactNode;
  isPending: boolean;
  onSubmit: (value: number) => Promise<void>;
};

export function NumberEditField({
  label,
  initialValue,
  required = true,
  min = 0,
  max,
  step = 0.01,
  description,
  display,
  isPending,
  onSubmit,
}: NumberEditFieldProps) {
  const [draft, setDraft] = useState(String(initialValue));
  const [editing, setEditing] = useState(false);

  function handleSubmit() {
    const parsed = Number(draft);
    if (Number.isNaN(parsed)) {
      toast.error(`${label} debe ser un número válido`);
      return;
    }
    if (min !== undefined && parsed < min) {
      toast.error(`${label} no puede ser menor a ${min}`);
      return;
    }
    if (max !== undefined && parsed > max) {
      toast.error(`${label} no puede ser mayor a ${max}`);
      return;
    }
    if (parsed === initialValue) {
      setEditing(false);
      return;
    }
    onSubmit(parsed)
      .then(() => setEditing(false))
      .catch(() => {});
  }

  function handleCancel() {
    setDraft(String(initialValue));
    setEditing(false);
  }

  return (
    <EditFieldShell label={label} required={required} description={description}>
      <Editable
        value={draft}
        onValueChange={setDraft}
        editing={editing}
        onEditingChange={setEditing}
        onEdit={() => setDraft(String(initialValue))}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        disabled={isPending}
      >
        <EditableArea className="block w-full">
          {editing ? (
            <div className="flex flex-col gap-2">
              <PrimitiveInput
                type="number"
                inputMode="decimal"
                value={draft}
                min={min}
                max={max}
                step={step}
                onChange={(e) => setDraft(e.target.value)}
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
            <EditFieldPreview>
              {display ? display(initialValue) : initialValue.toString()}
            </EditFieldPreview>
          )}
        </EditableArea>
      </Editable>
    </EditFieldShell>
  );
}
