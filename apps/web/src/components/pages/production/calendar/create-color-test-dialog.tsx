"use client";

import { useMemo, useState } from "react";
import { Palette } from "lucide-react";
import { toast } from "sonner";
import { useCreatePrintColorTest } from "@/api/printing/printing.mutations";
import type { ProductionOrder } from "@/api/production-orders/production-orders.types";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductionOrderCombobox } from "./production-order-combobox";
import {
  DEFAULT_COLOR_TEST_MINUTES,
  clampMinutes,
  formatSize,
  sanitizeInteger,
} from "./printing-calendar-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateColorTestDialog({ open, onOpenChange }: Props) {
  const create = useCreatePrintColorTest();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (create.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent size="lg">
        {open ? (
          <CreateColorTestForm
            isSubmitting={create.isPending}
            onCancel={() => onOpenChange(false)}
            onSubmit={async (input) => {
              try {
                await create.mutateAsync(input);
                toast.success("Prueba de color agregada a Sin agendar.");
                onOpenChange(false);
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "No se pudo crear la prueba de color.",
                );
              }
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateColorTestForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    productionOrderItemId: string;
    durationMinutes: number;
    notes: string | null;
  }) => void;
}) {
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(String(DEFAULT_COLOR_TEST_MINUTES));
  const [notes, setNotes] = useState("");

  const itemOptions = useMemo<ComboboxOption[]>(
    () =>
      (order?.items ?? [])
        .filter((item) => item.status !== "CANCELLED")
        .map((item) => {
          const code = item.billboardCode ?? "Sin código";
          return {
            value: item.id,
            label: code,
            filterValue: [code, item.address, item.cityName]
              .filter(Boolean)
              .join(" "),
            data: item,
          };
        }),
    [order],
  );

  const canSubmit = Boolean(itemId) && clampMinutes(minutes, 0) >= 1;

  function handleOrderChange(next: ProductionOrder | null) {
    setOrder(next);
    const available = (next?.items ?? []).filter(
      (item) => item.status !== "CANCELLED",
    );
    setItemId(available.length === 1 ? available[0].id : null);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <Palette className="size-4" />
          Nueva prueba de color
        </DialogTitle>
        <DialogDescription>
          La prueba se agrega a Sin agendar; arrástrala a una máquina para
          reservar su horario antes de imprimir la valla.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="flex flex-col gap-4">
        <ProductionOrderCombobox
          value={order}
          onChange={handleOrderChange}
          disabled={isSubmitting}
        />

        <Combobox
          label="Valla estática"
          required
          placeholder={
            order ? "Selecciona la valla" : "Primero selecciona una orden"
          }
          emptyLabel="La orden no tiene vallas disponibles."
          options={itemOptions}
          value={itemId}
          disabled={!order || isSubmitting}
          preserveOptionOrder
          onChange={(next) => setItemId(next ? String(next) : null)}
          renderOption={(option) => {
            const item = order?.items.find(
              (candidate) => candidate.id === option.value,
            );
            return (
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm">{option.label}</span>
                {item ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {[
                      formatSize(item.width, item.height),
                      item.address,
                      item.cityName,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                ) : null}
              </div>
            );
          }}
        />

        <Input
          label="Duración de la prueba (min)"
          type="text"
          inputMode="numeric"
          value={minutes}
          onChange={(event) => setMinutes(sanitizeInteger(event.target.value))}
          disabled={isSubmitting}
          className="tabular-nums"
        />

        <Textarea
          label="Notas"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Perfil de color, sustrato, observaciones..."
          maxLength={500}
          disabled={isSubmitting}
        />
      </DialogBody>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          icon={Palette}
          loading={isSubmitting}
          disabled={!canSubmit}
          onClick={() => {
            if (!itemId) return;
            onSubmit({
              productionOrderItemId: itemId,
              durationMinutes: clampMinutes(minutes, 1),
              notes: notes.trim() || null,
            });
          }}
        >
          Agregar a Sin agendar
        </Button>
      </DialogFooter>
    </>
  );
}
