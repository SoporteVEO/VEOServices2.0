"use client";

import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/primitives/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TONE_BORDER_CLASS } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import { formatCount, formatIso, plural } from "./pantallas-format";
import { attentionDaysText, attentionGroups, type AttentionGroup } from "./pantallas-logic";
import { SectionHeading } from "./section-heading";
import { CampaignStatusBadge } from "./tone-badge";

function AttentionCard({ group }: { group: AttentionGroup }) {
  const { goToScreen, openDialog } = usePantallas();
  const finished = group.status === "FINISHED";

  return (
    <Card
      size="sm"
      className={cn(
        "border border-l-4 border-border/80 py-3 shadow-none ring-0",
        TONE_BORDER_CLASS[finished ? "critical" : "warning"],
      )}
    >
      <CardContent className="flex flex-col gap-2 px-4 py-0">
        <div className="flex items-center gap-2">
          <CampaignStatusBadge status={group.status} />
          <span className="text-xs text-muted-foreground">{attentionDaysText(group.days)}</span>
          {finished ? (
            <Button
              variant="ghost"
              sizeVariant="sm"
              className="ml-auto border-0 shadow-none text-red-600 hover:text-red-700"
              icon={Trash2}
              aria-label={`Eliminar ${group.client} de todas sus pantallas`}
              title={
                group.items.length === 1
                  ? "Eliminar de su pantalla"
                  : `Eliminar de las ${group.items.length} ubicaciones`
              }
              onClick={() => openDialog({ type: "attentionDelete", groupKey: group.key })}
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{group.client}</p>
          <p className="truncate text-xs text-muted-foreground">{group.campaign || "Sin campaña"}</p>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            <b className="text-foreground">{group.screens}</b> {plural(group.screens, "pantalla")}
          </span>
          <span>
            <b className="text-foreground">{formatCount(group.spots)}</b> spots
          </span>
          <span>
            termina <b className="text-foreground">{formatIso(group.endDate)}</b>
            {group.maxEndDate && group.maxEndDate !== group.endDate ? (
              <>
                {" "}
                a <b className="text-foreground">{formatIso(group.maxEndDate)}</b>
              </>
            ) : null}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {group.items.map((item) => (
            <button
              key={item.campaign.id}
              type="button"
              onClick={() => goToScreen(item.screen.id)}
              title={`Ir a ${item.screen.name} · ${item.sublist.name}`}
              className="flex cursor-pointer flex-col rounded-md border bg-muted/40 px-2 py-1 text-left transition-colors hover:bg-muted"
            >
              <span className="text-xs font-medium">{item.screen.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {item.sublist.name} · {formatCount(item.campaign.spotsPerDay)}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AttentionBlock({
  title,
  dotClass,
  groups,
}: {
  title: string;
  dotClass: string;
  groups: AttentionGroup[];
}) {
  if (!groups.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={cn("size-2 rounded-full", dotClass)} />
        {title}
        <span className="rounded-full bg-muted px-1.5 tabular-nums">{groups.length}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => (
          <AttentionCard key={group.key} group={group} />
        ))}
      </div>
    </div>
  );
}

export function AttentionSection() {
  const { board, refDate } = usePantallas();
  const groups = attentionGroups(board, refDate);
  if (!groups.length) return null;
  const locations = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="flex flex-col gap-3">
      <SectionHeading
        title="Requieren atención"
        hint={`${groups.length} ${plural(groups.length, "campaña")} · ${locations} ${plural(locations, "ubicación", "ubicaciones")}`}
      />
      <AttentionBlock
        title="Por vencer"
        dotClass="bg-amber-500"
        groups={groups.filter((g) => g.status === "EXPIRING")}
      />
      <AttentionBlock
        title="Finalizadas · listas para retirar"
        dotClass="bg-red-500"
        groups={groups.filter((g) => g.status === "FINISHED")}
      />
    </div>
  );
}
