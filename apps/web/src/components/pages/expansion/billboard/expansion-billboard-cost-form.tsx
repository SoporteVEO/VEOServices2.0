"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useUpdateBillboardCost } from "@/api/expansion/expansion.mutations";
import type { ExpansionBillboard } from "@/api/expansion/expansion.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_COST = 10_000_000;

export function ExpansionBillboardCostForm({ billboard }: { billboard: ExpansionBillboard }) {
  const [cost, setCost] = useState(billboard.monthlyCost == null ? "" : String(billboard.monthlyCost));
  const [notes, setNotes] = useState(billboard.costNotes ?? "");
  const updateCost = useUpdateBillboardCost();

  const trimmed = cost.trim();
  const parsed = trimmed ? Number(trimmed) : null;
  const invalid = parsed != null && (!Number.isFinite(parsed) || parsed < 0 || parsed > MAX_COST);
  const unchanged =
    parsed === billboard.monthlyCost && (notes.trim() || null) === (billboard.costNotes ?? null);

  async function save(monthlyCost: number | null) {
    try {
      await updateCost.mutateAsync({
        billboardId: billboard.billboardId,
        monthlyCost,
        notes: monthlyCost == null ? null : notes.trim() || null,
      });
      toast.success(
        monthlyCost == null ? "Costo eliminado." : "Costo guardado. Rentabilidad recalculada.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el costo.");
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col">
        <h4 className="text-sm font-semibold">Costo mensual de la valla</h4>
        <p className="text-xs text-muted-foreground">
          Arrendamiento del terreno, permisos, energía y mantenimiento. Con este dato la
          rentabilidad se calcula como ingresos contra costo; sin él, por ocupación.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
        <Input
          label="Costo (USD/mes)"
          type="number"
          min={0}
          step="1"
          placeholder="0"
          value={cost}
          onChange={(event) => setCost(event.target.value)}
          aria-invalid={invalid || undefined}
        />
        <Input
          label="Notas"
          maxLength={500}
          placeholder="Ej. arrendamiento $150 + energía $50"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      {invalid ? <p className="text-xs text-destructive">Ingresa un costo válido.</p> : null}
      <div className="flex justify-end gap-2">
        {billboard.monthlyCost != null ? (
          <Button
            variant="ghost"
            sizeVariant="sm"
            disabled={updateCost.isPending}
            onClick={() => save(null)}
          >
            Quitar costo
          </Button>
        ) : null}
        <Button
          sizeVariant="sm"
          icon={Save}
          loading={updateCost.isPending}
          disabled={invalid || parsed == null || unchanged}
          onClick={() => save(parsed)}
        >
          Guardar costo
        </Button>
      </div>
    </section>
  );
}
