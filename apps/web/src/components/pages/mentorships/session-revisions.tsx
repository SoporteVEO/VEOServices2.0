import { History } from "lucide-react";
import type { MentorshipRevision } from "@/api/mentorships/mentorships.types";
import { formatDateTime } from "./const";

export function SessionRevisions({
  revisions,
}: {
  revisions: MentorshipRevision[];
}) {
  if (revisions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Esta sesión no ha tenido cambios desde que se registró.
      </p>
    );
  }

  return (
    <ol className="flex flex-col">
      {revisions.map((revision, index) => (
        <li key={revision.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < revisions.length - 1 ? (
            <span
              aria-hidden
              className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-border"
            />
          ) : null}
          <div className="relative z-10 flex size-8 shrink-0 items-center justify-center border border-border bg-card text-muted-foreground">
            <History className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div>
              <p className="text-sm">
                {revision.actorName} modificó {revision.changes.length}{" "}
                {revision.changes.length === 1 ? "campo" : "campos"}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatDateTime(revision.createdAt)}
              </p>
            </div>
            {revision.reason ? (
              <p className="border-l-2 border-border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap">
                {revision.reason}
              </p>
            ) : null}
            <ul className="flex flex-col gap-1.5">
              {revision.changes.map((change) => (
                <li key={change.field} className="text-sm">
                  <span className="font-medium">{change.label}</span>
                  <div className="mt-0.5 grid grid-cols-1 gap-1 sm:grid-cols-2">
                    <span className="bg-red-500/5 px-2 py-1 text-muted-foreground line-through decoration-red-500/60 whitespace-pre-wrap">
                      {change.from || "—"}
                    </span>
                    <span className="bg-emerald-500/5 px-2 py-1 whitespace-pre-wrap">
                      {change.to || "—"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>
  );
}
