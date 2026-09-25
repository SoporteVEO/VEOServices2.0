"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateProductionOrder,
  useInvalidateProductionOrders,
} from "@/api/production-orders/production-orders.post";
import type { ProductionOrder } from "@/api/production-orders/production-orders.types";
import { StaticBillboardPicker } from "@/components/pages/my-space/quotation/static-billboard-picker";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PendingBillboardCard } from "./pending-billboard-card";
import {
  countPendingDocuments,
  toCreateItemInput,
  toPendingBillboard,
  uploadPendingDocuments,
  withDocument,
  type PendingBillboard,
} from "./pending-billboard";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (order: ProductionOrder) => void;
};

export function CreateProductionOrderDialog({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSubmitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent size="xl">
        {open ? (
          <CreateProductionOrderForm
            onCancel={() => onOpenChange(false)}
            onSubmittingChange={setIsSubmitting}
            onCreated={(order) => {
              onOpenChange(false);
              onCreated(order);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateProductionOrderForm({
  onCancel,
  onSubmittingChange,
  onCreated,
}: {
  onCancel: () => void;
  onSubmittingChange: (submitting: boolean) => void;
  onCreated: (order: ProductionOrder) => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<PendingBillboard[]>([]);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);

  const createMutation = useCreateProductionOrder();
  const invalidateProductionOrders = useInvalidateProductionOrders();

  const selectedIds = new Set(entries.map((e) => e.billboard.billboardId));
  const isBusy = progressLabel !== null;

  function updateEntry(
    billboardId: number,
    update: (entry: PendingBillboard) => PendingBillboard,
  ) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.billboard.billboardId === billboardId ? update(entry) : entry,
      ),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (customerName.trim().length < 2) {
      toast.error("Indica el cliente o campaña de la orden.");
      return;
    }
    if (entries.length === 0) {
      toast.error("Agrega al menos una valla estática.");
      return;
    }

    onSubmittingChange(true);
    setProgressLabel("Creando orden…");
    try {
      const order = await createMutation.mutateAsync({
        customerName: customerName.trim(),
        customerCompany: customerCompany.trim() || undefined,
        notes: notes.trim() || undefined,
        items: entries.map(toCreateItemInput),
      });

      const failed = await uploadPendingDocuments(order, entries, (done, total) =>
        setProgressLabel(`Subiendo documentos (${done + 1}/${total})…`),
      );

      await invalidateProductionOrders();

      if (failed > 0) {
        toast.warning(
          `Orden ${order.orderNumber} creada, pero ${failed} documento${failed === 1 ? "" : "s"} no se pudo cargar. Puedes reintentarlo desde el detalle.`,
        );
      } else {
        toast.success(`Orden ${order.orderNumber} creada.`);
      }
      onCreated(order);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo crear la orden.",
      );
    } finally {
      setProgressLabel(null);
      onSubmittingChange(false);
    }
  }

  const documentsCount = countPendingDocuments(entries);

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="contents">
      <DialogHeader>
        <DialogTitle>Nueva orden de producción</DialogTitle>
        <DialogDescription>
          Crea una orden que no proviene de una cotización. Selecciona las
          vallas estáticas y, si ya los tienes, carga sus documentos.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Cliente / campaña"
            required
            placeholder="Ej. Campaña institucional"
            value={customerName}
            disabled={isBusy}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            label="Empresa"
            placeholder="Opcional"
            value={customerCompany}
            disabled={isBusy}
            onChange={(e) => setCustomerCompany(e.target.value)}
          />
        </div>

        <Textarea
          label="Notas"
          rows={2}
          placeholder="Motivo de la orden, instrucciones para producción…"
          value={notes}
          disabled={isBusy}
          onChange={(e) => setNotes(e.target.value)}
        />

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold leading-none">
                Vallas estáticas
              </h3>
              <p className="pt-1 text-xs text-muted-foreground">
                Puedes agregar varias vallas a la misma orden.
              </p>
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">
              {entries.length} seleccionada{entries.length === 1 ? "" : "s"}
            </span>
          </div>

          <StaticBillboardPicker
            selectedIds={selectedIds}
            onSelect={(billboard) =>
              setEntries((prev) => [...prev, toPendingBillboard(billboard)])
            }
          />

          {entries.length === 0 ? (
            <p className="rounded-md border border-dashed bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
              Aún no has agregado vallas.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map((entry) => (
                <PendingBillboardCard
                  key={entry.billboard.billboardId}
                  entry={entry}
                  disabled={isBusy}
                  onRemove={() =>
                    setEntries((prev) =>
                      prev.filter(
                        (e) => e.billboard.billboardId !== entry.billboard.billboardId,
                      ),
                    )
                  }
                  onDocumentChange={(kind, file) =>
                    updateEntry(entry.billboard.billboardId, (e) =>
                      withDocument(e, kind, file),
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </DialogBody>

      <DialogFooter className="items-center border-t pt-4 sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {progressLabel ??
            `${documentsCount} documento${documentsCount === 1 ? "" : "s"} por cargar`}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isBusy}
            icon={isBusy ? Loader2 : Plus}
            iconClassName={isBusy ? "animate-spin" : undefined}
          >
            Crear orden
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}
