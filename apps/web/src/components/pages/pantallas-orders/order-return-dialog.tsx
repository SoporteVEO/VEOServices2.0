"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useReturnDigitalOrder } from "@/api/pantallas/pantallas.mutations";
import type { DigitalOrder } from "@/api/pantallas/pantallas.types";
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
import { Textarea } from "@/components/ui/textarea";
import { orderLabel } from "./pantallas-orders-logic";

function ReturnForm({ order, onDone }: { order: DigitalOrder; onDone: () => void }) {
  const returnOrder = useReturnDigitalOrder();
  const [reason, setReason] = useState("");

  function submit() {
    const text = reason.trim();
    if (!text) {
      toast.error("Escribe qué hay que corregir");
      return;
    }
    returnOrder.mutate(
      { id: order.id, reason: text },
      {
        onSuccess: () => {
          onDone();
          toast.success(`OP de ${order.client} devuelta a Soporte Comercial`);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Devolver a Soporte Comercial</DialogTitle>
        <DialogDescription>{orderLabel(order)}</DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-2">
        <Textarea
          label="¿Qué hay que corregir?"
          rows={4}
          maxLength={600}
          value={reason}
          placeholder="Ej. no hay espacio en Jerusalén con 900 spots; ¿se puede bajar a 450?"
          onChange={(e) => setReason(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Soporte Comercial lo verá en la OP y podrá corregirla y reenviarla con el mismo número.
        </p>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={returnOrder.isPending}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={returnOrder.isPending}>
          {returnOrder.isPending ? "Devolviendo…" : "Devolver"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function OrderReturnDialog({
  order,
  onClose,
}: {
  order: DigitalOrder | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(order)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="md">
        {order ? <ReturnForm key={order.id} order={order} onDone={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
