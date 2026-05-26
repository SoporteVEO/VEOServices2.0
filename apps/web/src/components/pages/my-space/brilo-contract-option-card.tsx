"use client";

import type { BriloContractOption } from "@/api/offers/offers.types";
import { formatBriloShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type BriloContractOptionCardProps = {
  contract: BriloContractOption;
  compact?: boolean;
  className?: string;
};

export function BriloContractOptionCard({
  contract,
  compact = false,
  className,
}: BriloContractOptionCardProps) {
  const ejecutivo = contract.ejecNombre?.trim();

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col text-left",
        compact ? "gap-0" : "gap-0.5",
        className,
      )}
    >
      <span
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-sm leading-tight" : "text-sm",
        )}
      >
        {contract.mconCodigo}
      </span>
      {ejecutivo ? (
        <span
          className={cn(
            "truncate text-foreground/90",
            compact ? "text-xs leading-snug" : "text-xs",
          )}
        >
          {ejecutivo}
        </span>
      ) : null}
      <span
        className={cn(
          "text-muted-foreground",
          compact ? "text-xs leading-snug" : "text-xs",
        )}
      >
        {formatBriloShortDate(contract.mconFecha)}
      </span>
    </div>
  );
}
