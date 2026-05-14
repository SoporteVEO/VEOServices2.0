"use client";

import { useState } from "react";
import {
  Editable,
  EditableArea,
} from "@/components/primitives/ui/editable";
import { DatePicker } from "@/components/ui/date-picker";
import {
  EditFieldPreview,
  EditFieldShell,
  EditFieldToolbar,
} from "./edit-field-shell";

export type DateEditFieldProps = {
  label: string;
  initialValue: Date | null;
  minDate?: Date;
  maxDate?: Date;
  allowClear?: boolean;
  display?: (value: Date) => React.ReactNode;
  emptyText?: string;
  description?: string;
  required?: boolean;
  isPending: boolean;
  onSubmit: (value: Date | null) => Promise<void>;
};

export function DateEditField({
  label,
  initialValue,
  minDate,
  maxDate,
  allowClear = true,
  display,
  emptyText = "Sin fecha",
  description,
  required,
  isPending,
  onSubmit,
}: DateEditFieldProps) {
  const [draft, setDraft] = useState<Date | null>(initialValue);
  const [editing, setEditing] = useState(false);

  function handleSubmit() {
    const currentTime = initialValue?.getTime() ?? null;
    const draftTime = draft?.getTime() ?? null;
    if (currentTime === draftTime) {
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

  return (
    <EditFieldShell label={label} required={required} description={description}>
      <Editable
        value={draft ? draft.toISOString() : ""}
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
              <DatePicker
                value={draft}
                onChange={(d) => setDraft(d ?? null)}
                minDate={minDate}
                maxDate={maxDate}
                allowClear={allowClear}
                disabled={isPending}
                placeholder={emptyText}
              />
              <EditFieldToolbar isPending={isPending} />
            </div>
          ) : (
            <EditFieldPreview empty={!initialValue}>
              {initialValue
                ? display
                  ? display(initialValue)
                  : initialValue.toLocaleDateString("es-ES")
                : emptyText}
            </EditFieldPreview>
          )}
        </EditableArea>
      </Editable>
    </EditFieldShell>
  );
}
