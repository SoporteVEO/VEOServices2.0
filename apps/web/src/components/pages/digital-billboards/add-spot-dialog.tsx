"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { AddSpotForm } from "./add-spot-form";

export function AddSpotDialog({
  open,
  onOpenChange,
  billboardId,
  selectedDay,
  maxSpots,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billboardId: string;
  selectedDay: Date;
  maxSpots: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar uso</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <AddSpotForm
            billboardId={billboardId}
            selectedDay={selectedDay}
            maxSpots={maxSpots}
            onSuccess={() => onOpenChange(false)}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
