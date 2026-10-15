"use client";

import { useState } from "react";
import { Badge } from "@/components/primitives/ui/badge";
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

const COMMON_REASONS = [
  "Precio / tarifa",
  "Sin disponibilidad en las fechas",
  "Ubicaciones no convencieron",
  "Eligió otro medio OOH",
  "Movió presupuesto a digital / TV",
  "Presupuesto recortado",
  "Campaña cancelada o pospuesta",
  "Agencia asignó a otro proveedor",
  "Sin respuesta",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealTitle?: string;
  pending?: boolean;
  onConfirm: (reason: string) => void;
}

export function CrmLostReasonDialog({
  open,
  onOpenChange,
  dealTitle,
  pending = false,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason("");
  }

  const trimmed = reason.trim();

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
          <DialogDescription>
            {dealTitle
              ? `¿Por qué se perdió "${dealTitle}"? Esto ayuda a mejorar el proceso de ventas.`
              : "¿Por qué se perdió este negocio?"}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {COMMON_REASONS.map((option) => (
              <Badge
                key={option}
                asChild
                variant={trimmed === option ? "default" : "outline"}
              >
                <button
                  type="button"
                  className="cursor-pointer"
                  onClick={() => setReason(option)}
                >
                  {option}
                </button>
              </Badge>
            ))}
          </div>
          <Textarea
            label="Motivo"
            rows={3}
            placeholder="Describe el motivo..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={trimmed.length < 2}
            loading={pending}
            onClick={() => onConfirm(trimmed)}
          >
            Marcar como perdido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
