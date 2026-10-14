import { Badge } from "@/components/primitives/ui/badge";
import { cn } from "@/lib/utils";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_TONE,
  TONE_BADGE_CLASS,
  TONE_DOT_CLASS,
  VERSION_STATUS_LABELS,
  VERSION_STATUS_TONE,
  type CampaignStatus,
  type StatusTone,
  type VersionStatus,
} from "./pantallas-const";

export function ToneBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 whitespace-nowrap font-medium", TONE_BADGE_CLASS[tone], className)}
    >
      <span className={cn("size-1.5", TONE_DOT_CLASS[tone])} />
      {children}
    </Badge>
  );
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <ToneBadge tone={CAMPAIGN_STATUS_TONE[status]}>
      {CAMPAIGN_STATUS_LABELS[status]}
    </ToneBadge>
  );
}

export function VersionStatusBadge({ status }: { status: VersionStatus }) {
  return (
    <ToneBadge tone={VERSION_STATUS_TONE[status]}>{VERSION_STATUS_LABELS[status]}</ToneBadge>
  );
}
