import { Pencil } from "lucide-react";
import type { PatchNote } from "@/api/patch-notes/patch-notes.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { AcademyMarkdown } from "@/components/pages/academy/academy-markdown";
import { formatPatchNoteDate, patchNoteAuthorName } from "./patch-notes-const";

type Props = {
  note: PatchNote;
  isCurrent: boolean;
  onEdit?: (note: PatchNote) => void;
};

export function PatchNoteCard({ note, isCurrent, onEdit }: Props) {
  return (
    <article className="relative overflow-hidden rounded-md border border-border bg-card px-5 py-5 sm:px-6">
      {isCurrent ? (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-veo-lime" />
      ) : null}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              v{note.version}
            </Badge>
            {isCurrent ? <Badge>Versión actual</Badge> : null}
          </div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            {note.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {formatPatchNoteDate(note.createdAt)} ·{" "}
            {patchNoteAuthorName(note.createdBy)}
          </p>
        </div>
        {onEdit ? (
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={Pencil}
            onClick={() => onEdit(note)}
          >
            Editar
          </Button>
        ) : null}
      </header>
      <div className="mt-4 border-t border-border pt-4">
        <AcademyMarkdown body={note.body} />
      </div>
    </article>
  );
}
