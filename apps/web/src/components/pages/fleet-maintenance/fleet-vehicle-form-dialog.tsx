"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateFleetVehicle,
  useUpdateFleetVehicle,
} from "@/api/fleet/fleet.mutations";
import type { FleetVehicleDetail } from "@/api/fleet/fleet.types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { blobToBase64, compressImage } from "@/lib/compress-image";
import { parseOptionalNumber } from "./fleet-const";
import { FleetVehiclePhoto } from "./fleet-vehicle-photo";

const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When present the dialog edits that vehicle instead of creating one. */
  vehicle?: FleetVehicleDetail | null;
  onCreated?: (vehicle: FleetVehicleDetail) => void;
};

interface FormState {
  plate: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  initialMileageKm: string;
  notes: string;
  photoBase64: string | null;
  removePhoto: boolean;
}

const EMPTY_FORM: FormState = {
  plate: "",
  brand: "",
  model: "",
  year: "",
  color: "",
  initialMileageKm: "",
  notes: "",
  photoBase64: null,
  removePhoto: false,
};

function formFromVehicle(vehicle: FleetVehicleDetail): FormState {
  return {
    plate: vehicle.plate,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year?.toString() ?? "",
    color: vehicle.color ?? "",
    initialMileageKm: vehicle.initialMileageKm?.toString() ?? "",
    notes: vehicle.notes ?? "",
    photoBase64: null,
    removePhoto: false,
  };
}

export function FleetVehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  onCreated,
}: Props) {
  const isEdit = !!vehicle;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [seededKey, setSeededKey] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateFleetVehicle();
  const updateMutation = useUpdateFleetVehicle();
  const isBusy =
    createMutation.isPending || updateMutation.isPending || isProcessingPhoto;

  const seedKey = open ? (vehicle?.id ?? "new") : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm(vehicle && seedKey ? formFromVehicle(vehicle) : EMPTY_FORM);
  }

  const previewUrl = form.photoBase64
    ? `data:image/webp;base64,${form.photoBase64}`
    : form.removePhoto
      ? null
      : (vehicle?.photoUrl ?? null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhotoSelected(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("La imagen supera el tamaño máximo permitido (25MB).");
      return;
    }

    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const base64 = await blobToBase64(compressed.blob);
      setForm((prev) => ({ ...prev, photoBase64: base64, removePhoto: false }));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo procesar la imagen.",
      );
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    setForm((prev) => ({ ...prev, photoBase64: null, removePhoto: true }));
  }

  function handleSubmit() {
    if (form.plate.trim().length < 2) {
      toast.error("Ingresa la placa del vehículo.");
      return;
    }
    if (!form.brand.trim() || !form.model.trim()) {
      toast.error("Ingresa la marca y el modelo.");
      return;
    }

    const year = parseOptionalNumber(form.year);
    if (year !== undefined && (!Number.isInteger(year) || year < 1950)) {
      toast.error("El año no es válido.");
      return;
    }
    const initialMileageKm = parseOptionalNumber(form.initialMileageKm);
    if (
      initialMileageKm !== undefined &&
      (!Number.isInteger(initialMileageKm) || initialMileageKm < 0)
    ) {
      toast.error("El kilometraje debe ser un número entero.");
      return;
    }

    const onError = (error: unknown) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo guardar el vehículo.",
      );

    if (isEdit && vehicle) {
      updateMutation.mutate(
        {
          id: vehicle.id,
          plate: form.plate.trim(),
          brand: form.brand.trim(),
          model: form.model.trim(),
          year: year ?? null,
          color: form.color.trim() || null,
          initialMileageKm: initialMileageKm ?? null,
          notes: form.notes.trim() || null,
          ...(form.photoBase64 ? { photoBase64: form.photoBase64 } : {}),
          ...(form.removePhoto ? { removePhoto: true } : {}),
        },
        {
          onSuccess: () => {
            toast.success("Vehículo actualizado.");
            onOpenChange(false);
          },
          onError,
        },
      );
      return;
    }

    createMutation.mutate(
      {
        plate: form.plate.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year,
        color: form.color.trim() || undefined,
        initialMileageKm,
        notes: form.notes.trim() || undefined,
        photoBase64: form.photoBase64 ?? undefined,
      },
      {
        onSuccess: (created) => {
          toast.success(`Vehículo ${created.plate} registrado.`);
          onOpenChange(false);
          onCreated?.(created);
        },
        onError,
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar vehículo" : "Nuevo vehículo"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Placa ${vehicle?.plate}`
              : "Registra un vehículo de la empresa en el inventario de flota."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-3">
            <FleetVehiclePhoto
              url={previewUrl}
              alt="Foto del vehículo"
              className="size-20"
              sizes="80px"
            />
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  void handlePhotoSelected(event.target.files?.[0])
                }
              />
              <Button
                variant="outline"
                sizeVariant="sm"
                icon={isProcessingPhoto ? Loader2 : ImagePlus}
                iconClassName={isProcessingPhoto ? "animate-spin" : undefined}
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? "Cambiar foto" : "Subir foto"}
              </Button>
              {previewUrl ? (
                <Button
                  variant="outline"
                  sizeVariant="sm"
                  icon={Trash2}
                  disabled={isBusy}
                  onClick={handleRemovePhoto}
                >
                  Quitar
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Placa"
              required
              placeholder="Ej. P123-456"
              value={form.plate}
              onChange={(event) => update("plate", event.target.value)}
            />
            <Input
              label="Color"
              placeholder="Ej. Blanco"
              value={form.color}
              onChange={(event) => update("color", event.target.value)}
            />
            <Input
              label="Marca"
              required
              placeholder="Ej. Toyota"
              value={form.brand}
              onChange={(event) => update("brand", event.target.value)}
            />
            <Input
              label="Modelo"
              required
              placeholder="Ej. Hilux"
              value={form.model}
              onChange={(event) => update("model", event.target.value)}
            />
            <Input
              label="Año"
              type="number"
              inputMode="numeric"
              placeholder="Ej. 2021"
              value={form.year}
              onChange={(event) => update("year", event.target.value)}
            />
            <Input
              label="Km en el último mantenimiento"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Ej. 45000"
              value={form.initialMileageKm}
              onChange={(event) =>
                update("initialMileageKm", event.target.value)
              }
            />
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            El kilometraje se actualiza solo cada vez que registras un
            mantenimiento.
          </p>

          <Textarea
            label="Notas"
            rows={3}
            placeholder="Información adicional del vehículo..."
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isBusy}>
            {isEdit ? "Guardar cambios" : "Registrar vehículo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
