"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useUpdateCrmTask } from "@/api/crm/crm.mutations";
import type { CrmDashboard, CrmDashboardDeal } from "@/api/crm/crm.types";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { errorMessage, timeAgo } from "../crm-format";

interface Props {
  dashboard: CrmDashboard | undefined;
  isLoading: boolean;
  onOpenDeal: (dealId: string) => void;
}

export function CrmDashboardLists({ dashboard, isLoading, onOpenDeal }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <UpcomingTasksCard dashboard={dashboard} isLoading={isLoading} />
      <DealListCard
        title="Negocios principales"
        description="Mayor valor abierto"
        deals={dashboard?.topDeals}
        isLoading={isLoading}
        emptyMessage="No hay negocios abiertos."
        onOpenDeal={onOpenDeal}
      />
      <DealListCard
        title="Negocios sin seguimiento"
        description="Superaron los días permitidos sin actividad"
        deals={dashboard?.staleDeals}
        isLoading={isLoading}
        emptyMessage="Todo al día. ¡Buen trabajo!"
        onOpenDeal={onOpenDeal}
        stale
      />
    </div>
  );
}

function UpcomingTasksCard({
  dashboard,
  isLoading,
}: Pick<Props, "dashboard" | "isLoading">) {
  const updateTask = useUpdateCrmTask();

  function complete(id: string) {
    updateTask.mutate(
      { id, completed: true },
      {
        onSuccess: () => toast.success("Tarea completada"),
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo completar la tarea.")),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas tareas</CardTitle>
        <CardDescription>Pendientes ordenadas por fecha</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" sizeVariant="sm">
            <Link href="/dashboard/crm/tareas">
              Ver todas <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading || !dashboard ? (
          <ListSkeleton />
        ) : dashboard.upcomingTasks.length === 0 ? (
          <EmptyList message="No tienes tareas pendientes." />
        ) : (
          <ul className="flex flex-col divide-y">
            {dashboard.upcomingTasks.map((task) => (
              <li key={task.id} className="flex items-start gap-3 py-2.5">
                <Checkbox
                  className="mt-0.5"
                  aria-label={`Completar ${task.title}`}
                  disabled={updateTask.isPending}
                  onCheckedChange={(checked) => {
                    if (checked) complete(task.id);
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {task.dealTitle ?? "Sin negocio"}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 text-xs tabular-nums",
                    task.isOverdue
                      ? "text-red-600 dark:text-red-400"
                      : "text-muted-foreground",
                  )}
                >
                  <CalendarClock className="size-3" />
                  {timeAgo(task.dueAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DealListCard({
  title,
  description,
  deals,
  isLoading,
  emptyMessage,
  onOpenDeal,
  stale = false,
}: {
  title: string;
  description: string;
  deals: CrmDashboardDeal[] | undefined;
  isLoading: boolean;
  emptyMessage: string;
  onOpenDeal: (dealId: string) => void;
  stale?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !deals ? (
          <ListSkeleton />
        ) : deals.length === 0 ? (
          <EmptyList message={emptyMessage} />
        ) : (
          <ul className="flex flex-col divide-y">
            {deals.map((deal) => (
              <li key={deal.id}>
                <button
                  type="button"
                  onClick={() => onOpenDeal(deal.id)}
                  className="flex w-full cursor-pointer items-center gap-3 py-2.5 text-left hover:bg-muted/40"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: deal.stageColor ?? undefined }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{deal.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[deal.clientName, deal.stageName].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoney(deal.value)}
                    </span>
                    {stale ? (
                      <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3" />
                        {timeAgo(deal.lastActivityAt)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {deal.ownerName}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-4" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}

export function EmptyList({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{message}</p>
  );
}
