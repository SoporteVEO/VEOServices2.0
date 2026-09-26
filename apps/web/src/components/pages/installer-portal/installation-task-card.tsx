import { CalendarClock, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import type { InstallationTaskListItem } from "@/api/installations/installations.types";
import { Badge } from "@/components/primitives/ui/badge";
import { FieldOrderKindBadge } from "@/components/pages/field-portal/field-order-kind-badge";
import { ProductionOrderStatusBadge } from "@/components/pages/production-orders-shared/production-order-status-badge";
import { formatBriloShortDate } from "@/lib/format";
import { installerPortalPath } from "@/lib/installer-portal";

export function InstallationTaskCard({
  task,
  showLocation,
}: {
  task: InstallationTaskListItem;
  showLocation: boolean;
}) {
  const location =
    [task.address, task.cityName, task.departmentName]
      .filter(Boolean)
      .join(", ") || "Sin dirección";

  return (
    <Link
      href={installerPortalPath(task.id)}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors active:bg-accent/50"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <FieldOrderKindBadge kind="installation" />
          <Badge variant="secondary" className="font-mono">
            {task.billboardCode ?? "—"}
          </Badge>
          <ProductionOrderStatusBadge status={task.status} />
        </div>

        <p className="truncate text-sm font-medium">
          {task.customerCompany ?? task.customerName}
        </p>

        {showLocation ? (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
            <span className="line-clamp-2">{location}</span>
          </p>
        ) : null}

        {task.scheduledInstallationAt ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3 shrink-0" aria-hidden />
            Programada: {formatBriloShortDate(task.scheduledInstallationAt)}
          </p>
        ) : null}
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
