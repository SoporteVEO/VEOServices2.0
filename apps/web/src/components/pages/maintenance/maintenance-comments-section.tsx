"use client";

import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import type { MaintenanceComment } from "@/api/maintenance/maintenance.types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatBriloShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { personName } from "./maintenance-const";

type Props = {
  comments: MaintenanceComment[];
  onSubmit: (body: string) => Promise<unknown>;
  isPending?: boolean;
  /** Hides the composer, e.g. on a cancelled job. */
  readOnly?: boolean;
  className?: string;
};

export function MaintenanceCommentsSection({
  comments,
  onSubmit,
  isPending = false,
  readOnly = false,
  className,
}: Props) {
  const [body, setBody] = useState("");

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await onSubmit(trimmed);
      setBody("");
      toast.success("Comentario agregado.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo agregar el comentario.",
      );
    }
  }

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="size-4 text-muted-foreground" aria-hidden />
        Comentarios{" "}
        <span className="text-xs font-normal text-muted-foreground">
          ({comments.length})
        </span>
      </h4>

      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aún no hay comentarios en esta orden.
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

      {readOnly ? null : (
        <div className="flex flex-col gap-2">
          <Textarea
            rows={3}
            maxLength={2000}
            placeholder="Escribe un comentario..."
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button
            sizeVariant="sm"
            icon={Send}
            className="self-end"
            loading={isPending}
            disabled={isPending || body.trim().length === 0}
            onClick={handleSubmit}
          >
            Comentar
          </Button>
        </div>
      )}
    </section>
  );
}
