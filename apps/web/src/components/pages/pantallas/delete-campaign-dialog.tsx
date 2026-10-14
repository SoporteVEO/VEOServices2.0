"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDeleteCampaigns } from "@/api/pantallas/pantallas.mutations";
import { Checkbox } from "@/components/primitives/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePantallas } from "./pantallas-context";
import { formatCount, formatIso, plural } from "./pantallas-format";
import { findLocation, occurrencesOf, type CampaignLocation } from "./pantallas-logic";

function DeleteForm({ location, onDone }: { location: CampaignLocation; onDone: () => void }) {
  const { board } = usePantallas();
  const deleteCampaigns = useDeleteCampaigns();
  const { campaign, screen, sublist } = location;
  const others = occurrencesOf(board, campaign);
  const [selected, setSelected] = useState(
    () => new Set(others.filter((o) => o.sameCampaign).map((o) => o.campaign.id)),
  );
  const screensCount = new Set(others.map((o) => o.screen.id)).size;

  function remove(ids: string[], message: string) {
    deleteCampaigns.mutate(
      { ids },
      {
        onSuccess: () => {
          onDone();
          toast.success(message);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Eliminar campaña</DialogTitle>
        <DialogDescription>
          {campaign.client} · {campaign.campaign || "sin nombre de campaña"} ·{" "}
          {formatIso(campaign.startDate)} → {formatIso(campaign.endDate)} ·{" "}
          {formatCount(campaign.spotsPerDay)} spots
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-3">
        <p className="text-sm">
          Se va a quitar de{" "}
          <b>
            {screen.name} · {sublist.name}
          </b>
          .
        </p>
        {others.length ? (
          <>
            <p className="text-xs font-medium text-muted-foreground">
              Este cliente también está en {screensCount} {plural(screensCount, "pantalla")} más
            </p>
            <div className="flex flex-col divide-y rounded-lg border">
              {others.map((o) => (
                <label key={o.campaign.id} className="flex cursor-pointer items-start gap-3 px-3 py-2">
                  <Checkbox
                    className="mt-0.5"
                    checked={selected.has(o.campaign.id)}
                    onCheckedChange={(value) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (value) next.add(o.campaign.id);
                        else next.delete(o.campaign.id);
                        return next;
                      })
                    }
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">
                      {o.screen.name} · {o.sublist.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {o.campaign.campaign || "sin campaña"} · {formatIso(o.campaign.startDate)} →{" "}
                      {formatIso(o.campaign.endDate)} · {formatCount(o.campaign.spotsPerDay)} spots
                      {o.sameCampaign ? " · misma campaña" : " · otra campaña o fechas"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Vienen marcadas las que son exactamente la misma campaña. Desmárcalas si quieres
              conservarlas.
            </p>
          </>
        ) : null}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={deleteCampaigns.isPending}>
          Cancelar
        </Button>
        <Button
          variant={others.length ? "outline" : "destructive"}
          disabled={deleteCampaigns.isPending}
          onClick={() =>
            remove(
              [campaign.id],
              others.length
                ? `${campaign.client} eliminada de ${sublist.name} · sigue en ${others.length} ${plural(others.length, "lugar", "lugares")}`
                : "Campaña eliminada",
            )
          }
        >
          {others.length ? "Eliminar solo de aquí" : "Eliminar"}
        </Button>
        {others.length ? (
          <Button
            variant="destructive"
            disabled={deleteCampaigns.isPending || selected.size === 0}
            onClick={() =>
              remove(
                [campaign.id, ...selected],
                `${campaign.client} eliminada en ${selected.size + 1} listas`,
              )
            }
          >
            {selected.size ? `Eliminar aquí y en ${selected.size} más` : "Eliminar en todas"}
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}

export function DeleteCampaignDialog({
  campaignId,
  onClose,
}: {
  campaignId: string | null;
  onClose: () => void;
}) {
  const { board } = usePantallas();
  const location = campaignId ? findLocation(board, campaignId) : null;

  return (
    <Dialog open={Boolean(location)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="lg">
        {location ? <DeleteForm key={location.campaign.id} location={location} onDone={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
