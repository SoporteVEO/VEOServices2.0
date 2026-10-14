"use client";

import { toast } from "sonner";
import { useDeleteCampaigns } from "@/api/pantallas/pantallas.mutations";
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
import { formatCount, formatIso } from "./pantallas-format";
import { attentionGroups } from "./pantallas-logic";

export function AttentionDeleteDialog({
  groupKey,
  onClose,
}: {
  groupKey: string | null;
  onClose: () => void;
}) {
  const { board, refDate } = usePantallas();
  const deleteCampaigns = useDeleteCampaigns();
  const group = groupKey
    ? attentionGroups(board, refDate).find((g) => g.key === groupKey && g.status === "FINISHED")
    : null;

  function handleDelete() {
    if (!group) return;
    const count = group.items.length;
    deleteCampaigns.mutate(
      { ids: group.items.map((i) => i.campaign.id) },
      {
        onSuccess: () => {
          onClose();
          toast.success(
            `${group.client} eliminada de ${count} ${count === 1 ? "ubicación" : "ubicaciones"}`,
          );
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <Dialog open={Boolean(group)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="lg">
        {group ? (
          <>
            <DialogHeader>
              <DialogTitle>Eliminar campaña finalizada</DialogTitle>
              <DialogDescription>
                {group.client} · {group.campaign || "sin campaña"} · terminó el{" "}
                {formatIso(group.endDate)}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground">Se va a quitar de</p>
              <div className="flex flex-col divide-y rounded-lg border">
                {group.items.map((item) => (
                  <div key={item.campaign.id} className="flex flex-col px-3 py-2">
                    <span className="text-sm font-medium">
                      {item.screen.name} · {item.sublist.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatIso(item.campaign.startDate)} → {formatIso(item.campaign.endDate)} ·{" "}
                      {formatCount(item.campaign.spotsPerDay)} spots
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Libera {formatCount(group.spots)} spots. Es lo mismo que borrarla en cada pantalla,
                pero de una sola vez.
              </p>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={deleteCampaigns.isPending}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteCampaigns.isPending}>
                {group.items.length === 1
                  ? "Eliminar de la pantalla"
                  : `Eliminar de las ${group.items.length} ubicaciones`}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
