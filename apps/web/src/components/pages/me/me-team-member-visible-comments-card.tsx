"use client";

import { MessageSquare } from "lucide-react";
import type { MeTeamMember } from "@/api/me/me.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { formatHumanDate } from "@/lib/format";

export function MeTeamMemberVisibleCommentsCard({
  teamMember,
}: {
  teamMember: MeTeamMember;
}) {
  const comments = teamMember.teamMemberComments ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitleWithInfo info="Solo ves las notas que recursos humanos guardó marcando la opción de compartir contigo.">
          Notas de recursos humanos
        </CardTitleWithInfo>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay notas compartidas contigo.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="flex gap-3 rounded-lg border border-border/80 bg-muted/25 p-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/60 ring-1 ring-border">
                  <MessageSquare className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {formatHumanDate(c.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {c.comment}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
