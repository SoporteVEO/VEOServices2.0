"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import { usePatchNotes } from "@/api/patch-notes/patch-notes.get";
import type { PatchNote } from "@/api/patch-notes/patch-notes.types";
import type { SubRole } from "@/api/users/users.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { PatchNoteCard } from "./patch-note-card";
import { PatchNoteDialog } from "./patch-note-dialog";
import { DEVELOPER_SUB_ROLE, suggestNextVersion } from "./patch-notes-const";

type DialogState =
  | { open: false }
  | { open: true; note: PatchNote | null };

export function PatchNotesPage() {
  const { data: notes, isLoading, isError } = usePatchNotes();
  const { data: session } = authClient.useSession();
  const [dialog, setDialog] = useState<DialogState>({ open: false });

  const sessionUser = session?.user as Record<string, unknown> | undefined;
  const subRoles = (sessionUser?.subRoles as SubRole[] | undefined) ?? [];
  const canManage = subRoles.includes(DEVELOPER_SUB_ROLE);
  const currentVersion = notes?.[0]?.version ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Megaphone className="size-3.5" />
            Actualizaciones
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Novedades de VEO Services
          </h1>
          <p className="text-sm text-muted-foreground">
            Todo lo nuevo que llega a la plataforma, versión por versión.
          </p>
        </div>
        {canManage ? (
          <Button
            icon={Plus}
            onClick={() => setDialog({ open: true, note: null })}
          >
            Nueva actualización
          </Button>
        ) : null}
      </section>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          No pudimos cargar las actualizaciones.
        </p>
      ) : notes && notes.length > 0 ? (
        <div className="flex flex-col gap-4">
          {notes.map((note) => (
            <PatchNoteCard
              key={note.id}
              note={note}
              isCurrent={note.version === currentVersion}
              onEdit={
                canManage
                  ? (selected) => setDialog({ open: true, note: selected })
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aún no hay actualizaciones publicadas.
        </p>
      )}

      <PatchNoteDialog
        open={dialog.open}
        note={dialog.open ? dialog.note : null}
        suggestedVersion={suggestNextVersion(currentVersion)}
        onOpenChange={(open) => {
          if (!open) setDialog({ open: false });
        }}
      />
    </div>
  );
}
