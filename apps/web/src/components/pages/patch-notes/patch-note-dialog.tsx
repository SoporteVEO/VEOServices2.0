"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePatchNote,
  useDeletePatchNote,
  useUpdatePatchNote,
} from "@/api/patch-notes/patch-notes.mutations";
import type { PatchNote } from "@/api/patch-notes/patch-notes.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MAX_BODY_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_BODY_LENGTH,
  MIN_TITLE_LENGTH,
  VERSION_PATTERN,
} from "./patch-notes-const";

type Props = {
  open: boolean;
  note: PatchNote | null;
  suggestedVersion: string;
  onOpenChange: (open: boolean) => void;
};

/** Creates a patch note when `note` is null, otherwise edits it. */
export function PatchNoteDialog({
  open,
  note,
  suggestedVersion,
  onOpenChange,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        {open ? (
          <PatchNoteForm
            key={note?.id ?? "new"}
            note={note}
            suggestedVersion={suggestedVersion}
            onDone={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function PatchNoteForm({
  note,
  suggestedVersion,
  onDone,
}: {
  note: PatchNote | null;
  suggestedVersion: string;
  onDone: () => void;
}) {
  const [version, setVersion] = useState(note?.version ?? suggestedVersion);
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const create = useCreatePatchNote();
  const update = useUpdatePatchNote();
  const remove = useDeletePatchNote();
  const busy = create.isPending || update.isPending || remove.isPending;

  const input = {
    version: version.trim(),
    title: title.trim(),
    body: body.trim(),
  };
  const isValid =
    VERSION_PATTERN.test(input.version) &&
    input.title.length >= MIN_TITLE_LENGTH &&
    input.body.length >= MIN_BODY_LENGTH;
  const isDirty =
    !note ||
    input.version !== note.version ||
    input.title !== note.title ||
    input.body !== note.body;

  const callbacks = (message: string) => ({
    onSuccess: () => {
      toast.success(message);
      onDone();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleSave() {
    if (note) {
      update.mutate(
        { id: note.id, input },
        callbacks("Actualización guardada"),
      );
    } else {
      create.mutate(
        input,
        callbacks("Actualización publicada y notificada a todos"),
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {note ? "Editar actualización" : "Nueva actualización"}
        </DialogTitle>
        <DialogDescription>
          {note
            ? "Los cambios no vuelven a enviar la notificación."
            : "Al publicarla se enviará una notificación a todos los usuarios."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <Input
            label="Versión"
            placeholder="1.0.0"
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            aria-invalid={version.length > 0 && !VERSION_PATTERN.test(version.trim())}
          />
          <Input
            label="Título"
            placeholder="Ej.: Notificaciones con enlace"
            maxLength={MAX_TITLE_LENGTH}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <Textarea
          label="Novedades (admite Markdown)"
          placeholder={"## Novedades\n\n- Nueva sección de ...\n- Mejora en ..."}
          rows={10}
          maxLength={MAX_BODY_LENGTH}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </DialogBody>
      <DialogFooter className="sm:justify-between">
        {note ? (
          <Button
            variant="destructive"
            icon={Trash2}
            disabled={busy}
            onClick={() =>
              remove.mutate(note.id, callbacks("Actualización eliminada"))
            }
          >
            Eliminar
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone} disabled={busy}>
            Cancelar
          </Button>
          <Button
            icon={Save}
            disabled={busy || !isValid || !isDirty}
            onClick={handleSave}
          >
            {busy ? "Guardando…" : note ? "Guardar" : "Publicar"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
