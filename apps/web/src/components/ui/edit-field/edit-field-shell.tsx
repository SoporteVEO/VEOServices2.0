"use client";

import { Loader2, Pencil } from "lucide-react";
import {
  EditableCancel,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
} from "@/components/primitives/ui/editable";
import { Label } from "@/components/primitives/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EditFieldShellProps = {
  label: string;
  required?: boolean;
  description?: string;
  className?: string;
  children: React.ReactNode;
};

export function EditFieldShell({
  label,
  required,
  description,
  className,
  children,
}: EditFieldShellProps) {
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

export type EditFieldPreviewProps = {
  children: React.ReactNode;
  empty?: boolean;
  className?: string;
};

export function EditFieldPreview({
  children,
  empty,
  className,
}: EditFieldPreviewProps) {
  return (
    <EditableTrigger asChild>
      <button
        type="button"
        className={cn(
          "group flex min-h-8 w-full items-center justify-between gap-2 rounded-lg border border-transparent bg-accent/40 px-2.5 py-1 text-left text-sm transition-colors hover:border-input hover:bg-accent focus-visible:border-ring focus-visible:bg-accent focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50",
          empty ? "text-muted-foreground italic" : "text-foreground",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70" />
      </button>
    </EditableTrigger>
  );
}

export type EditFieldToolbarProps = {
  isPending: boolean;
  cancelLabel?: string;
  submitLabel?: string;
};

export function EditFieldToolbar({
  isPending,
  cancelLabel = "Cancelar",
  submitLabel = "Guardar",
}: EditFieldToolbarProps) {
  return (
    <EditableToolbar className="justify-end">
      <EditableCancel asChild>
        <Button
          type="button"
          variant="outline"
          sizeVariant="sm"
          disabled={isPending}
        >
          {cancelLabel}
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
          {submitLabel}
        </Button>
      </EditableSubmit>
    </EditableToolbar>
  );
}
