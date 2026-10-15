"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCrmActivities } from "@/api/crm/crm.get";
import { useDeleteCrmActivity } from "@/api/crm/crm.mutations";
import type { CrmActivity, CrmContextQuery } from "@/api/crm/crm.types";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_TONES } from "../crm-const";
import { errorMessage, personName, timeAgo } from "../crm-format";
import { EmptyList, ListSkeleton } from "../dashboard/crm-dashboard-lists";

const MANUAL_TYPES = new Set(["NOTE", "CALL", "MEETING"]);

export function CrmActivityTimeline({
  context,
  showDeal = false,
}: {
  context: CrmContextQuery;
  showDeal?: boolean;
}) {
  const { data: session } = authClient.useSession();
  const { data: activities = [], isLoading } = useCrmActivities(context);
  const deleteActivity = useDeleteCrmActivity();
  const [pendingDelete, setPendingDelete] = useState<CrmActivity | null>(null);

  function confirmDelete() {
    if (!pendingDelete) return;
    deleteActivity.mutate(
      { id: pendingDelete.id },
      {
        onSuccess: () => {
          toast.success("Actividad eliminada");
          setPendingDelete(null);
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo eliminar la actividad.")),
      },
    );
  }

  if (isLoading) return <ListSkeleton rows={4} />;
  if (activities.length === 0) {
    return <EmptyList message="Aún no hay actividad registrada." />;
  }

  return (
    <>
      <ol className="relative flex flex-col gap-4 before:absolute before:inset-y-2 before:left-3.5 before:w-px before:bg-border">
        {activities.map((activity) => {
          const Icon = ACTIVITY_ICONS[activity.type];
          const canDelete =
            MANUAL_TYPES.has(activity.type) &&
            activity.actor?.id === session?.user.id;
          return (
            <li key={activity.id} className="group relative flex gap-3">
              <span
                className={cn(
                  "z-10 flex size-7 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                  ACTIVITY_TONES[activity.type],
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm">
                    <span className="font-medium">
                      {activity.subject || ACTIVITY_LABELS[activity.type]}
                    </span>
                    {showDeal && activity.deal ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {activity.deal.title}
                      </span>
                    ) : null}
                  </p>
                  {canDelete ? (
                    <PrimitiveButton
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Eliminar actividad"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setPendingDelete(activity)}
                    >
                      <Trash2 />
                    </PrimitiveButton>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[
                    activity.actor ? personName(activity.actor) : "Sistema",
                    timeAgo(activity.occurredAt),
                    activity.durationMinutes
                      ? `${activity.durationMinutes} min`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {activity.body ? (
                  <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-foreground/90">
                    {activity.body}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Eliminar actividad"
        description="Esta acción no se puede deshacer."
        pending={deleteActivity.isPending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
