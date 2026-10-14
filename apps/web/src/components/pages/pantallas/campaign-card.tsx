"use client";

import { GripVertical, Pause } from "lucide-react";
import { toast } from "sonner";
import { useSetCampaignPause } from "@/api/pantallas/pantallas.mutations";
import type { Campaign, Sublist } from "@/api/pantallas/pantallas.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ART_BADGE_CLASS,
  ART_LABELS,
  CAMPAIGN_STATUS_TONE,
  DEAL_BADGE_CLASS,
  DEAL_LABELS,
  TONE_BADGE_CLASS,
  TONE_BORDER_CLASS,
  VERSION_STATUS_TONE,
} from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import { daysUntil, formatCount, formatIso } from "./pantallas-format";
import { campaignStatus, versionsSummary } from "./pantallas-logic";
import { CampaignStatusBadge } from "./tone-badge";

export interface DraggedCampaign {
  campaignId: string;
  sublistId: string;
  spotsPerDay: number;
}

export function CampaignCard({
  campaign,
  sublist,
  onDragStart,
  onDragEnd,
}: {
  campaign: Campaign;
  sublist: Sublist;
  onDragStart: (drag: DraggedCampaign) => void;
  onDragEnd: () => void;
}) {
  const { refDate, canEdit, openDialog } = usePantallas();
  const setPause = useSetCampaignPause();
  const status = campaignStatus(campaign, refDate);
  const days = daysUntil(refDate, campaign.endDate);
  const versions = versionsSummary(campaign.versions, refDate);

  function togglePause() {
    const paused = !campaign.paused;
    setPause.mutate(
      { id: campaign.id, paused },
      {
        onSuccess: () =>
          toast.success(
            paused
              ? `${campaign.client} en pausa · ${formatCount(campaign.spotsPerDay)} spots liberados`
              : `${campaign.client} reanudada`,
          ),
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", campaign.id);
        onDragStart({
          campaignId: campaign.id,
          sublistId: sublist.id,
          spotsPerDay: campaign.spotsPerDay,
        });
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-l-4 bg-background p-2.5 text-xs",
        TONE_BORDER_CLASS[CAMPAIGN_STATUS_TONE[status]],
        status === "FINISHED" && "opacity-70",
        canEdit && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-center gap-1.5">
        {canEdit ? <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60" /> : null}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {campaign.client || "(sin nombre)"}
        </span>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-semibold tabular-nums">
          {formatCount(campaign.spotsPerDay)}
        </span>
      </div>
      {campaign.campaign ? <p className="text-muted-foreground">{campaign.campaign}</p> : null}
      <p className="tabular-nums text-muted-foreground">
        {formatIso(campaign.startDate)} → {formatIso(campaign.endDate)}
        {days !== null
          ? ` · ${days >= 0 ? `faltan ${days} d` : `terminó hace ${Math.abs(days)} d`}`
          : ""}
      </p>
      {campaign.notes ? <p className="text-muted-foreground">{campaign.notes}</p> : null}
      {campaign.paused ? (
        <p className="flex items-center gap-1 font-medium text-violet-600 dark:text-violet-400">
          <Pause className="size-3" />
          En pausa{campaign.pauseReason ? ` — ${campaign.pauseReason}` : ""}
        </p>
      ) : null}
      {campaign.art !== "RECEIVED" || campaign.deal !== "COMMERCIAL" || versions ? (
        <div className="flex flex-wrap gap-1">
          {campaign.art !== "RECEIVED" ? (
            <Badge variant="outline" className={ART_BADGE_CLASS[campaign.art]}>
              {ART_LABELS[campaign.art]}
            </Badge>
          ) : null}
          {campaign.deal !== "COMMERCIAL" ? (
            <Badge variant="outline" className={DEAL_BADGE_CLASS[campaign.deal]}>
              {DEAL_LABELS[campaign.deal]}
            </Badge>
          ) : null}
          {versions ? (
            <Badge
              variant="outline"
              title={versions.detail}
              className={TONE_BADGE_CLASS[VERSION_STATUS_TONE[versions.worst]]}
            >
              {versions.total} {versions.total === 1 ? "versión" : "versiones"}
            </Badge>
          ) : null}
        </div>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <CampaignStatusBadge status={status} />
        <div className="ml-auto flex gap-1">
          {canEdit ? (
            <>
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="border-0 shadow-none"
                disabled={setPause.isPending}
                onClick={togglePause}
              >
                {campaign.paused ? "Reanudar" : "Pausar"}
              </Button>
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="border-0 shadow-none"
                onClick={() =>
                  openDialog({ type: "campaign", sublistId: sublist.id, campaignId: campaign.id })
                }
              >
                Editar
              </Button>
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="border-0 text-red-600 shadow-none hover:text-red-700"
                onClick={() => openDialog({ type: "deleteCampaign", campaignId: campaign.id })}
              >
                Borrar
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              sizeVariant="sm"
              className="border-0 shadow-none"
              onClick={() => openDialog({ type: "campaignDetail", campaignId: campaign.id })}
            >
              Ver detalle
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
