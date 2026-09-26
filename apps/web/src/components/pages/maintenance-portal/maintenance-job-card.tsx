import {
  AlertTriangle,
  CalendarClock,
  Camera,
  ChevronRight,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import type { MaintenanceJobListItem } from "@/api/maintenance/maintenance.types";
import { Badge } from "@/components/primitives/ui/badge";
import { FieldOrderKindBadge } from "@/components/pages/field-portal/field-order-kind-badge";
import { MaintenanceCategoryBadge } from "@/components/pages/maintenance/maintenance-category-badge";
import { MaintenanceStatusBadge } from "@/components/pages/maintenance/maintenance-status-badge";
import { formatBriloShortDate } from "@/lib/format";
import { maintenancePortalPath } from "@/lib/maintenance-portal";

export function MaintenanceJobCard({ job }: { job: MaintenanceJobListItem }) {
  const location =
    [job.address, job.cityName, job.departmentName].filter(Boolean).join(", ") ||
    "Sin dirección";

  return (
    <Link
      href={maintenancePortalPath(job.id)}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors active:bg-accent/50"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <FieldOrderKindBadge kind="maintenance" />
          <Badge variant="secondary" className="font-mono">
            {job.billboardCode ?? job.code}
          </Badge>
          <MaintenanceStatusBadge status={job.status} />
          <MaintenanceCategoryBadge category={job.category} />
        </div>

        <p className="line-clamp-2 text-sm font-medium">{job.description}</p>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span className="line-clamp-2">{location}</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            {job.isOverdue ? (
              <AlertTriangle
                className="size-3 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden
              />
            ) : (
              <CalendarClock className="size-3 shrink-0" aria-hidden />
            )}
            <span
              className={job.isOverdue ? "text-red-600 dark:text-red-400" : ""}
            >
              {formatBriloShortDate(job.scheduledAt)}
            </span>
          </span>
          {job.photoCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <Camera className="size-3 shrink-0" aria-hidden />
              {job.photoCount}
            </span>
          ) : null}
        </div>
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}
