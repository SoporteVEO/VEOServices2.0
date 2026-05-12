"use client";

import type { ComponentProps } from "react";
import type { AbsenceStatus } from "@/api/absences/absences.types";
import {
  Status,
  StatusIndicator,
  StatusLabel,
} from "@/components/primitives/ui/status";

type StatusVariant = ComponentProps<typeof Status>["variant"];

const STATUS_MAP: Record<
  AbsenceStatus,
  { label: string; variant: StatusVariant }
> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  APPROVED: { label: "Aprobada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "error" },
};

export function AbsenceStatusBadge({ status }: { status: AbsenceStatus }) {
  const config = STATUS_MAP[status];
  return (
    <Status variant={config.variant}>
      <StatusIndicator />
      <StatusLabel>{config.label}</StatusLabel>
    </Status>
  );
}
