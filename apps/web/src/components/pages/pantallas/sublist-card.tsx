"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useDeleteSublist } from "@/api/pantallas/pantallas.mutations";
import type { Sublist } from "@/api/pantallas/pantallas.types";
import { Card, CardContent } from "@/components/primitives/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { CAMPAIGN_STATUS_ORDER } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";
import { formatCount } from "./pantallas-format";
import { campaignStatus, sublistStats } from "./pantallas-logic";
import { CampaignCard, type DraggedCampaign } from "./campaign-card";
import { OccupancyBar } from "./occupancy-bar";

export function SublistCard({
  sublist,
  hideFinished,
  dragging,
  onDragStart,
  onDragEnd,
  onDropCampaign,
}: {
  sublist: Sublist;
  hideFinished: boolean;
  dragging: DraggedCampaign | null;
  onDragStart: (drag: DraggedCampaign) => void;
  onDragEnd: () => void;
  onDropCampaign: (sublist: Sublist) => void;
}) {
  const { refDate, canEdit, openDialog } = usePantallas();
  const deleteSublist = useDeleteSublist();
  const [dropHover, setDropHover] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const stats = sublistStats(sublist, refDate);

  const visible = sublist.campaigns
    .filter((c) => !hideFinished || campaignStatus(c, refDate) !== "FINISHED")
    .sort(
      (a, b) =>
        CAMPAIGN_STATUS_ORDER[campaignStatus(a, refDate)] -
        CAMPAIGN_STATUS_ORDER[campaignStatus(b, refDate)],
    );

  const isDropTarget = dragging !== null && dragging.sublistId !== sublist.id;
  const fits = dragging ? dragging.spotsPerDay <= stats.free : true;

  const campaignCount = sublist.campaigns.length;

  function handleDelete() {
    deleteSublist.mutate(
      { id: sublist.id },
      {
        onSuccess: () => {
          toast.success("Sublista eliminada");
          setConfirmDeleteOpen(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Card
      size="sm"
      onDragOver={(e) => {
        if (!isDropTarget) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!dropHover) setDropHover(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropHover(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDropHover(false);
        if (isDropTarget) onDropCampaign(sublist);
      }}
      className={cn(
        "border py-3 shadow-none ring-0 transition-colors",
        stats.used > sublist.capacity && "border-red-500/50",
        dropHover && (fits ? "border-emerald-500 bg-emerald-500/5" : "border-red-500 bg-red-500/5"),
      )}
    >
      <CardContent className="flex flex-col gap-2 px-3 py-0">
        <div className="flex items-center gap-1">
          <h4 className="min-w-0 flex-1 truncate text-sm font-semibold">{sublist.name}</h4>
          {canEdit ? (
            <>
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="border-0 shadow-none"
                icon={Pencil}
                title="Renombrar o cambiar capacidad"
                onClick={() => openDialog({ type: "sublist", sublistId: sublist.id })}
              />
              <Button
                variant="ghost"
                sizeVariant="sm"
                className="border-0 text-red-600 shadow-none hover:text-red-700"
                icon={X}
                title="Eliminar sublista"
                disabled={deleteSublist.isPending}
                onClick={() => setConfirmDeleteOpen(true)}
              />
            </>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatCount(stats.used)} / {formatCount(sublist.capacity)} spots · {stats.pct.toFixed(0)}%
          {stats.free > 0 ? (
            ` · ${formatCount(stats.free)} libres`
          ) : stats.free < 0 ? (
            <b className="text-red-600"> · {formatCount(-stats.free)} sobre</b>
          ) : (
            " · completa"
          )}
          {stats.pausedSpots ? (
            <b className="text-violet-600 dark:text-violet-400">
              {" "}
              · {formatCount(stats.pausedSpots)} en pausa
            </b>
          ) : null}
        </p>
        <OccupancyBar pct={stats.pct} pausedPct={stats.pausedPct} className="h-1.5" />

        <div className="flex flex-col gap-2 pt-1">
          {!sublist.campaigns.length ? (
            <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
              Sublista libre — {formatCount(sublist.capacity)} spots disponibles
            </p>
          ) : !visible.length ? (
            <p className="rounded-lg border border-dashed py-4 text-center text-xs text-muted-foreground">
              {sublist.campaigns.length} campaña(s) finalizada(s) oculta(s) —{" "}
              {formatCount(sublist.capacity)} spots disponibles
            </p>
          ) : (
            visible.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                sublist={sublist}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {canEdit ? (
            <Button
              variant="outline"
              sizeVariant="sm"
              icon={Plus}
              onClick={() => openDialog({ type: "campaign", sublistId: sublist.id, campaignId: null })}
            >
              Agregar cliente
            </Button>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted-foreground">
            {stats.active} al aire{stats.pausedCount ? ` · ${stats.pausedCount} en pausa` : ""}
          </span>
        </div>
      </CardContent>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`¿Eliminar la sublista “${sublist.name}”?`}
        description={
          campaignCount
            ? `Tiene ${campaignCount} campaña(s). Se eliminará la sublista completa.`
            : undefined
        }
        pending={deleteSublist.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
