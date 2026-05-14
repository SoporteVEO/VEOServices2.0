"use client";

import { useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Editable,
  EditableArea,
  EditableCancel,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
} from "@/components/primitives/ui/editable";
import { Input as PrimitiveInput } from "@/components/primitives/ui/input";
import { Label } from "@/components/primitives/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

type FieldShellProps = {
  label: string;
  required?: boolean;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

function FieldShell({
  label,
  required,
  description,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="-ml-1 text-red-500">*</span> : null}
      </Label>
      {children}
      {description ? (
        <p className="text-[11px] leading-snug text-muted-foreground/80">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function FieldPreviewButton({
  children,
  empty,
}: {
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <EditableTrigger asChild>
      <button
        type="button"
        className={cn(
          "group flex min-h-8 w-full items-center justify-between gap-2 rounded-lg border border-transparent bg-accent/40 px-2.5 py-1 text-left text-sm transition-colors hover:border-input hover:bg-accent focus-visible:border-ring focus-visible:bg-accent focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50",
          empty ? "text-muted-foreground italic" : "text-foreground",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70" />
      </button>
    </EditableTrigger>
  );
}

function FieldToolbar({ isPending }: { isPending: boolean }) {
  return (
    <EditableToolbar className="justify-end">
      <EditableCancel asChild>
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          disabled={isPending}
        >
          Cancelar
        </Button>
      </EditableCancel>
      <EditableSubmit asChild>
        <Button
          type="button"
          sizeVariant="sm"
          disabled={isPending}
          icon={isPending ? Loader2 : undefined}
          iconClassName={isPending ? "animate-spin" : undefined}
        >
          Guardar
        </Button>
      </EditableSubmit>
    </EditableToolbar>
  );
}

type TextEditFieldProps = {
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
    <FieldShell label={label} required={required} description={description}>
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
              <FieldToolbar isPending={isPending} />
            </div>
          ) : (
            <FieldPreviewButton empty={!normalized}>
              {normalized || emptyText}
            </FieldPreviewButton>
          )}
        </EditableArea>
      </Editable>
    </FieldShell>
  );
}

type NumberEditFieldProps = {
  label: string;
  initialValue: number;
  required?: boolean;
  min?: number;
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
    <FieldShell label={label} required={required} description={description}>
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
              <FieldToolbar isPending={isPending} />
            </div>
          ) : (
            <FieldPreviewButton>
              {display ? display(initialValue) : initialValue.toString()}
            </FieldPreviewButton>
          )}
        </EditableArea>
      </Editable>
    </FieldShell>
  );
}

type DateEditFieldProps = {
  label: string;
  initialValue: Date | null;
  minDate?: Date;
  maxDate?: Date;
  allowClear?: boolean;
  display?: (value: Date) => React.ReactNode;
  emptyText?: string;
  description?: string;
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
    <FieldShell label={label} description={description}>
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
              <FieldToolbar isPending={isPending} />
            </div>
          ) : (
            <FieldPreviewButton empty={!initialValue}>
              {initialValue
                ? display
                  ? display(initialValue)
                  : initialValue.toLocaleDateString("es-ES")
                : emptyText}
            </FieldPreviewButton>
          )}
        </EditableArea>
      </Editable>
    </FieldShell>
  );
}

type SelectEditFieldOption = {
  value: string;
  label: string;
};

type SelectEditFieldProps = {
  label: string;
  initialValue: string;
  options: SelectEditFieldOption[];
  description?: string;
  isPending: boolean;
  onSubmit: (value: string) => Promise<void>;
};

export function SelectEditField({
  label,
  initialValue,
  options,
  description,
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

  const displayLabel =
    options.find((o) => o.value === initialValue)?.label ?? initialValue;

  return (
    <FieldShell label={label} description={description}>
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
              <FieldToolbar isPending={isPending} />
            </div>
          ) : (
            <FieldPreviewButton>{displayLabel}</FieldPreviewButton>
          )}
        </EditableArea>
      </Editable>
    </FieldShell>
  );
}

type ComboboxEditFieldProps = {
  label: string;
  initialValue: string | null;
  options: ComboboxOption[];
  selectedOption?: ComboboxOption | null;
  emptyText?: string;
  description?: string;
  placeholder?: string;
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
  const displayNode =
    displayOption?.label ?? selectedOption?.label ?? null;

  return (
    <FieldShell label={label} description={description}>
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
                required={false}
              />
              <FieldToolbar isPending={isPending} />
            </div>
          ) : (
            <FieldPreviewButton empty={!displayNode}>
              {displayNode ?? emptyText}
            </FieldPreviewButton>
          )}
        </EditableArea>
      </Editable>
    </FieldShell>
  );
}
