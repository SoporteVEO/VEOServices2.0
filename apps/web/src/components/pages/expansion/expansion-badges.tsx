import type {
  ExpansionSiteStatus,
  ProfitabilityBasis,
  ProfitabilityTier,
} from "@/api/expansion/expansion.types";
import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import { SITE_STATUS_META, TIER_META } from "./expansion-const";
import { VERDICT_META, type Verdict } from "./expansion-analysis";

export function TierBadge({
  tier,
  score,
  className,
}: {
  tier: ProfitabilityTier;
  score?: number;
  className?: string;
}) {
  const { label, color } = TIER_META[tier];
  return (
    <Badge
      variant="outline"
      style={{ borderColor: color, color }}
      className={cn("bg-transparent", className)}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
      {score != null ? <span className="tabular-nums">· {score}</span> : null}
    </Badge>
  );
}

export function SiteStatusBadge({ status }: { status: ExpansionSiteStatus }) {
  const meta = SITE_STATUS_META[status];
  return <Badge variant={meta.badge}>{meta.label}</Badge>;
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const meta = VERDICT_META[verdict];
  return <Badge variant={meta.badge}>{meta.label}</Badge>;
}

export function BasisHint({ basis }: { basis: ProfitabilityBasis }) {
  return (
    <span className="text-[11px] text-muted-foreground">
      {basis === "COST" ? "Ingresos vs. costo mensual" : "Sin costo: basado en ocupación"}
    </span>
  );
}

export function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}
