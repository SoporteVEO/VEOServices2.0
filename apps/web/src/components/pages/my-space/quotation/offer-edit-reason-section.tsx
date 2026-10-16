"use client";

import { MessageSquareText } from "lucide-react";
import type { OfferEditReason } from "@/api/offers/offers.types";
import { Label } from "@/components/primitives/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OFFER_EDIT_REASON_OPTIONS } from "./offer-edit-reasons";

export interface OfferEditReasonValue {
  reason: OfferEditReason | null;
  note: string;
}

interface OfferEditReasonSectionProps {
  value: OfferEditReasonValue;
  onChange: (value: OfferEditReasonValue) => void;
  required: boolean;
  billboardsBefore: number;
  billboardsAfter: number;
}

export function OfferEditReasonSection({
  value,
  onChange,
  required,
  billboardsBefore,
  billboardsAfter,
}: OfferEditReasonSectionProps) {
  const noteRequired = value.reason === "OTHER";

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <MessageSquareText className="size-3.5" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold leading-none">
            Motivo del cambio{required ? "" : " (opcional)"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {required
              ? `Las vallas cambiaron de ${billboardsBefore} a ${billboardsAfter}. Indica por qué para el historial.`
              : "Queda registrado en el historial de la cotización."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="offer-edit-reason">
            Motivo{required ? " *" : ""}
          </Label>
          <Select
            value={value.reason ?? ""}
            onValueChange={(next) =>
              onChange({ ...value, reason: next as OfferEditReason })
            }
          >
            <SelectTrigger id="offer-edit-reason" className="w-full">
              <SelectValue placeholder="Selecciona un motivo" />
            </SelectTrigger>
            <SelectContent>
              {OFFER_EDIT_REASON_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="offer-edit-reason-note">
            Detalle{noteRequired ? " *" : ""}
          </Label>
          <Textarea
            id="offer-edit-reason-note"
            value={value.note}
            maxLength={1000}
            rows={2}
            placeholder="Ej. El cliente redujo su presupuesto del trimestre."
            onChange={(event) =>
              onChange({ ...value, note: event.target.value })
            }
          />
        </div>
      </div>
    </section>
  );
}
