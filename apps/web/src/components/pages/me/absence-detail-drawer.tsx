"use client";

import { useRef, useState } from "react";
import {
  CalendarDays,
  Clock,
  FileText,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type {
  Absence,
  UpdateAbsenceInput,
} from "@/api/absences/absences.types";
import {
  useDeleteMyAbsence,
  useUpdateMyAbsence,
} from "@/api/absences/absences.mutations";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Editable,
  EditableArea,
  EditableCancel,
  EditableSubmit,
  EditableToolbar,
  EditableTrigger,
} from "@/components/primitives/ui/editable";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Separator } from "@/components/primitives/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import {
  AbsenceStatusBadge,
  computeAbsenceDays,
  fileToBase64,
} from "@/components/pages/absences";
import { NativeDelete } from "@/components/uitripled/native-delete-shadcnui";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type AbsenceDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  absence: Absence | null;
};

export function AbsenceDetailDrawer({
  open,
  onOpenChange,
  absence,
}: AbsenceDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[560px]">
        {absence ? (
          <AbsenceDetailContent
            key={absence.id}
            absence={absence}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function AbsenceDetailContent({
  absence,
  onClose,
}: {
  absence: Absence;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteMyAbsence();
  const updateMutation = useUpdateMyAbsence();
  const days = computeAbsenceDays(absence.fromDate, absence.toDate);

  function update(input: UpdateAbsenceInput) {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { id: absence.id, ...input },
        {
          onSuccess: () => {
            toast.success("Cambios guardados");
            resolve();
          },
          onError: (err: Error) => {
            toast.error(err.message || "Error al actualizar");
            reject(err);
          },
        },
      );
    });
  }

  function handleDelete() {
    deleteMutation.mutate(absence.id, {
      onSuccess: () => {
        toast.success("Solicitud eliminada");
        onClose();
      },
      onError: (err: Error) => toast.error(err.message || "Error al eliminar"),
    });
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <DrawerTitle className="text-base font-semibold">
              Detalle de la incapacidad
            </DrawerTitle>
            <DrawerDescription className="flex items-center gap-1.5 text-xs">
              <CalendarDays className="size-3 shrink-0" />
              <span className="truncate">
                {days} {days === 1 ? "día" : "días"} de incapacidad
              </span>
            </DrawerDescription>
            <div className="pt-1.5">
              <AbsenceStatusBadge status={absence.status} />
            </div>
          </div>
          <PrimitiveButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 p-4">
          <Section
            icon={CalendarDays}
            title="Periodo"
            description="Haz clic en una fecha para editarla."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DateEditField
                key={`from:${absence.updatedAt}`}
                label="Desde"
                initialIso={absence.fromDate}
                maxIso={absence.toDate}
                isPending={updateMutation.isPending}
                onSubmit={(iso) => update({ fromDate: iso })}
              />
              <DateEditField
                key={`to:${absence.updatedAt}`}
                label="Hasta"
                initialIso={absence.toDate}
                minIso={absence.fromDate}
                isPending={updateMutation.isPending}
                onSubmit={(iso) => update({ toDate: iso })}
              />
            </div>
          </Section>

          <Section
            icon={FileText}
            title="Motivo"
            description="Haz clic para editar el motivo de la incapacidad."
          >
            <ReasonEditField
              key={`reason:${absence.updatedAt}`}
              initialValue={absence.reason}
              isPending={updateMutation.isPending}
              onSubmit={(reason) => update({ reason })}
            />
          </Section>

          <Section
            icon={ImagePlus}
            title="Documentos"
            description={
              absence.images.length === 0
                ? "Agrega constancias médicas u otros documentos."
                : `${absence.images.length} ${absence.images.length === 1 ? "archivo adjunto" : "archivos adjuntos"}.`
            }
          >
            <DocumentsEditor
              absence={absence}
              isPending={updateMutation.isPending}
              onUpdate={update}
            />
          </Section>

          <Separator />

          <MetadataRow absence={absence} />
        </div>
      </ScrollArea>

      <DrawerFooter className="flex-row items-center justify-between gap-3 border-t">
        <p className="text-xs text-muted-foreground">Eliminar es permanente.</p>
        <NativeDelete
          buttonText="Eliminar"
          confirmText="Confirmar"
          size="sm"
          onConfirm={() => {}}
          onDelete={handleDelete}
          disabled={deleteMutation.isPending}
        />
      </DrawerFooter>
    </>
  );
}

function DateEditField({
  label,
  initialIso,
  minIso,
  maxIso,
  isPending,
  onSubmit,
}: {
  label: string;
  initialIso: string;
  minIso?: string;
  maxIso?: string;
  isPending: boolean;
  onSubmit: (iso: string) => Promise<void>;
}) {
  const initialDate = new Date(initialIso);
  const [draft, setDraft] = useState<Date>(initialDate);
  const [editing, setEditing] = useState(false);

  const minDate = minIso ? new Date(minIso) : undefined;
  const maxDate = maxIso ? new Date(maxIso) : undefined;

  function handleSubmit() {
    if (draft.getTime() === initialDate.getTime()) {
      setEditing(false);
      return;
    }
    onSubmit(draft.toISOString())
      .then(() => setEditing(false))
      .catch(() => {});
  }

  function handleCancel() {
    setDraft(initialDate);
    setEditing(false);
  }

  return (
    <Editable
      value={draft.toISOString()}
      editing={editing}
      onEditingChange={setEditing}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      disabled={isPending}
    >
      <EditableArea className="block w-full">
        <div className="flex flex-col gap-1 rounded-md border bg-accent/10 p-3">
          <span className="text-[11px] font-medium text-muted-foreground">
            {label}
          </span>
          {editing ? (
            <div className="flex flex-col gap-2">
              <DatePicker
                value={draft}
                onChange={(d) => {
                  if (d) setDraft(d);
                }}
                minDate={minDate}
                maxDate={maxDate}
                disabled={isPending}
              />
              <FieldToolbar isPending={isPending} />
            </div>
          ) : (
            <EditableTrigger asChild>
              <button
                type="button"
                className="group flex items-center justify-between gap-2 rounded-sm text-left text-sm font-semibold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>{formatLongDate(initialIso)}</span>
                <Pencil className="size-3 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" />
              </button>
            </EditableTrigger>
          )}
        </div>
      </EditableArea>
    </Editable>
  );
}

function ReasonEditField({
  initialValue,
  isPending,
  onSubmit,
}: {
  initialValue: string;
  isPending: boolean;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initialValue);
  const [editing, setEditing] = useState(false);

  function handleSubmit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error("El motivo no puede estar vacío");
      return;
    }
    if (trimmed === initialValue.trim()) {
      setEditing(false);
      return;
    }
    onSubmit(trimmed)
      .then(() => setEditing(false))
      .catch(() => {});
  }

  function handleCancel() {
    setDraft(initialValue);
    setEditing(false);
  }

  return (
    <Editable
      value={draft}
      onValueChange={setDraft}
      editing={editing}
      onEditingChange={setEditing}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      disabled={isPending}
    >
      <EditableArea className="block w-full">
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              autoFocus
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancel();
                }
              }}
            />
            <FieldToolbar isPending={isPending} />
          </div>
        ) : (
          <EditableTrigger asChild>
            <button
              type="button"
              className="group block w-full rounded-md border bg-muted/30 p-3 text-left text-sm whitespace-pre-wrap focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-2">
                <span>{initialValue}</span>
                <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" />
              </div>
            </button>
          </EditableTrigger>
        )}
      </EditableArea>
    </Editable>
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

function DocumentsEditor({
  absence,
  isPending,
  onUpdate,
}: {
  absence: Absence;
  isPending: boolean;
  onUpdate: (input: UpdateAbsenceInput) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const filesArr = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (filesArr.length === 0) return;

    setIsAdding(true);
    try {
      const base64s = await Promise.all(filesArr.map(fileToBase64));
      await onUpdate({ addedImages: base64s });
    } catch {
      // toast handled upstream
    } finally {
      setIsAdding(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(imageId: string) {
    setRemovingId(imageId);
    try {
      await onUpdate({ removedImageIds: [imageId] });
    } catch {
      // toast handled upstream
    } finally {
      setRemovingId(null);
    }
  }

  const isBusy = isPending || isAdding || removingId !== null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {absence.images.map((image) => {
          const isRemoving = removingId === image.id;
          return (
            <div
              key={image.id}
              className={cn(
                "group relative size-20 overflow-hidden rounded-md border bg-background",
                isRemoving && "opacity-50",
              )}
            >
              <a href={image.url} target="_blank" rel="noreferrer">
                <img
                  src={image.url}
                  alt="Documento de la incapacidad"
                  className="size-full object-cover"
                />
              </a>
              <button
                type="button"
                aria-label="Eliminar documento"
                onClick={() => handleRemove(image.id)}
                disabled={isBusy}
                className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 ring-1 ring-border transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed"
              >
                {isRemoving ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Agregar documento"
          disabled={isBusy}
          className="inline-flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAdding ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          <span className="text-[10px]">Agregar</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold leading-none">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="pl-8">{children}</div> : null}
    </section>
  );
}

function MetadataRow({ absence }: { absence: Absence }) {
  const items = [
    {
      icon: Clock,
      label: "Creada",
      value: formatLongDate(absence.createdAt),
    },
    {
      icon: Clock,
      label: "Actualizada",
      value: formatLongDate(absence.updatedAt),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 rounded-md border bg-accent/10 p-2.5"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <item.icon className="size-3" />
            {item.label}
          </div>
          <span className="truncate text-xs font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
