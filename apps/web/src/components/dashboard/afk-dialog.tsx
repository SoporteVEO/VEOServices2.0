"use client";

import { PauseCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/ui/dialog";
import { Button } from "@/components/ui/button";

type AfkDialogProps = {
  open: boolean;
  onDismiss: () => void;
};

export function AfkDialog({ open, onDismiss }: AfkDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDismiss();
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
            <PauseCircle className="size-6 text-muted-foreground" />
          </div>
          <DialogTitle>Seguimiento de tiempo pausado</DialogTitle>
          <DialogDescription>
            No detectamos actividad en la app, por lo que el contador de tiempo
            se pausó. Mueve el cursor o presiona cualquier tecla para reanudar
            el seguimiento.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onDismiss}>Seguir trabajando</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
