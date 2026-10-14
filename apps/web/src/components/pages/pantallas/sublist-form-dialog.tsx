"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useUpdateSublist } from "@/api/pantallas/pantallas.mutations";
import type { Sublist } from "@/api/pantallas/pantallas.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FULL_SUBLIST_SPOTS } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";

function SublistForm({ sublist, onDone }: { sublist: Sublist; onDone: () => void }) {
  const updateSublist = useUpdateSublist();
  const [name, setName] = useState(sublist.name);
  const [capacity, setCapacity] = useState(String(sublist.capacity));

  function submit() {
    updateSublist.mutate(
      {
        id: sublist.id,
        name: name.trim() || sublist.name,
        capacity: Number(capacity) || FULL_SUBLIST_SPOTS,
      },
      {
        onSuccess: () => {
          onDone();
          toast.success("Sublista actualizada");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar sublista</DialogTitle>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex flex-col gap-1">
          <Input
            label="Capacidad (spots)"
            type="number"
            min={1}
            step={50}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Una sublista normal es de {FULL_SUBLIST_SPOTS} spots (1 cliente de 900, 2 de 450 o 3 de
            300).
          </p>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={updateSublist.isPending}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={updateSublist.isPending}>
          Guardar
        </Button>
      </DialogFooter>
    </>
  );
}

export function SublistFormDialog({
  sublistId,
  onClose,
}: {
  sublistId: string | null;
  onClose: () => void;
}) {
  const { board } = usePantallas();
  const sublist = sublistId
    ? board.screens.flatMap((s) => s.sublists).find((s) => s.id === sublistId)
    : null;

  return (
    <Dialog open={Boolean(sublist)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="sm">
        {sublist ? <SublistForm key={sublist.id} sublist={sublist} onDone={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
