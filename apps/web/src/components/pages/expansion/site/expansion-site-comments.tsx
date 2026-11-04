"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAddExpansionComment } from "@/api/expansion/expansion.mutations";
import type { ExpansionSiteComment } from "@/api/expansion/expansion.types";
import { personName } from "@/components/pages/crm/crm-format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatBriloShortDate } from "@/lib/format";

export function ExpansionSiteComments({
  siteId,
  comments,
}: {
  siteId: string;
  comments: ExpansionSiteComment[];
}) {
  const [body, setBody] = useState("");
  const addComment = useAddExpansionComment(siteId);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync(trimmed);
      setBody("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el comentario.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      {comments.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Aún no hay comentarios. Comparte hallazgos de la visita, negociaciones o dudas.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border bg-muted/30 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-xs font-medium">
                  {comment.author ? personName(comment.author) : "Usuario"}
                </span>
                <time className="text-[11px] text-muted-foreground">
                  {formatBriloShortDate(comment.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap pt-1 text-sm">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          rows={3}
          maxLength={2000}
          placeholder="Escribe un comentario..."
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void handleSubmit();
          }}
        />
        <Button
          sizeVariant="sm"
          icon={Send}
          className="self-end"
          loading={addComment.isPending}
          disabled={body.trim().length === 0}
          onClick={handleSubmit}
        >
          Comentar
        </Button>
      </div>
    </section>
  );
}
