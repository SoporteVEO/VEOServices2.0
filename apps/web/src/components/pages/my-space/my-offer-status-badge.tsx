"use client";

import { Badge } from "@/components/primitives/ui/badge";
import type { OfferStatus } from "@/api/offers/offers.types";

const STATUS_LABELS: Record<OfferStatus, string> = {
  PENDING: "Pendiente",
  DECLINED: "Rechazada",
  ACCEPTED: "Aceptada",
};

const STATUS_VARIANTS: Record<
  OfferStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  DECLINED: "destructive",
  ACCEPTED: "default",
};

type MyOfferStatusBadgeProps = {
  status: OfferStatus;
};

export function MyOfferStatusBadge({ status }: MyOfferStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className="whitespace-nowrap">
      {STATUS_LABELS[status]}
    </Badge>
  );
}
