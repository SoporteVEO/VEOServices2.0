import type { InstallationTaskListItem } from "@/api/installations/installations.types";
import type { MaintenanceJobListItem } from "@/api/maintenance/maintenance.types";

export type FieldOrder =
  | {
      kind: "installation";
      id: string;
      date: string | null;
      task: InstallationTaskListItem;
    }
  | {
      kind: "maintenance";
      id: string;
      date: string | null;
      job: MaintenanceJobListItem;
    };

export interface GroupedFieldOrders {
  pending: FieldOrder[];
  done: FieldOrder[];
}

function toTime(date: string | null): number {
  return date ? new Date(date).getTime() : Number.POSITIVE_INFINITY;
}

/**
 * Merges both kinds of job into one agenda: open work soonest first (undated
 * last), finished work most recent first. The operario's part of an
 * installation ends with the vulcanizado photo, not with the panel mounted.
 */
export function groupFieldOrders(
  tasks: InstallationTaskListItem[],
  jobs: MaintenanceJobListItem[],
  isVulcanizadoOnly: boolean,
): GroupedFieldOrders {
  const pending: FieldOrder[] = [];
  const done: FieldOrder[] = [];

  for (const task of tasks) {
    const order: FieldOrder = {
      kind: "installation",
      id: task.id,
      date: task.scheduledInstallationAt,
      task,
    };
    const isDone = isVulcanizadoOnly
      ? task.hasVulcanizadoImage
      : task.installedAt !== null;
    (isDone ? done : pending).push(order);
  }

  for (const job of jobs) {
    if (job.status === "CANCELLED") continue;
    const order: FieldOrder = {
      kind: "maintenance",
      id: job.id,
      date: job.scheduledAt,
      job,
    };
    (job.status === "COMPLETED" ? done : pending).push(order);
  }

  pending.sort((a, b) => toTime(a.date) - toTime(b.date));
  done.sort((a, b) => toTime(b.date) - toTime(a.date));
  return { pending, done };
}
