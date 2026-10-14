"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateScreen, useUpdateScreen } from "@/api/pantallas/pantallas.mutations";
import type { Screen, ScreenInput } from "@/api/pantallas/pantallas.types";
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
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { blobToBase64, compressImage } from "@/lib/compress-image";
import { SUGGESTED_TURN_ON } from "./pantallas-const";
import { usePantallas } from "./pantallas-context";

interface FormState {
  code: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  price: string;
  maxSpots: string;
  turnOnAt: string;
  turnOffAt: string;
  aliases: string;
  imageBase64?: string;
}

function initialState(screen: Screen | null): FormState {
  return {
    code: screen?.code ?? "",
    name: screen?.name ?? "",
    address: screen?.address ?? "",
    latitude: screen ? String(screen.latitude) : "",
    longitude: screen ? String(screen.longitude) : "",
    price: screen ? String(screen.price) : "",
    maxSpots: String(screen?.maxSpots ?? 900),
    turnOnAt: screen?.turnOnAt ?? SUGGESTED_TURN_ON,
    turnOffAt: screen?.turnOffAt ?? "22:00",
    aliases: (screen?.aliases ?? []).join(", "),
  };
}

function ScreenForm({ screen, onDone }: { screen: Screen | null; onDone: () => void }) {
  const createScreen = useCreateScreen();
  const updateScreen = useUpdateScreen();
  const [form, setForm] = useState(() => initialState(screen));
  const [processingImage, setProcessingImage] = useState(false);
  const isBusy = createScreen.isPending || updateScreen.isPending || processingImage;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleImage(blob: Blob) {
    setProcessingImage(true);
    try {
      const compressed = await compressImage(blob);
      set("imageBase64", await blobToBase64(compressed.blob));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo procesar la imagen");
    } finally {
      setProcessingImage(false);
    }
  }

  function submit() {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("El código y el nombre son obligatorios");
      return;
    }
    if (form.turnOnAt === form.turnOffAt) {
      toast.error("El encendido y el apagado no pueden ser la misma hora");
      return;
    }
    const input: ScreenInput = {
      code: form.code.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
      latitude: Number(form.latitude) || 0,
      longitude: Number(form.longitude) || 0,
      price: Number(form.price) || 0,
      maxSpots: Math.max(1, Math.round(Number(form.maxSpots) || 900)),
      turnOnAt: form.turnOnAt,
      turnOffAt: form.turnOffAt,
      aliases: form.aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      ...(form.imageBase64 ? { imageBase64: form.imageBase64 } : {}),
    };
    const callbacks = {
      onSuccess: () => {
        onDone();
        toast.success(screen ? "Pantalla actualizada" : "Pantalla creada");
      },
      onError: (err: Error) => toast.error(err.message),
    };
    if (screen) updateScreen.mutate({ id: screen.id, ...input }, callbacks);
    else createScreen.mutate(input, callbacks);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{screen ? "Editar pantalla" : "Nueva pantalla"}</DialogTitle>
        <DialogDescription>
          {screen
            ? "Los cambios se reflejan en Pantallas y en las cotizaciones."
            : "Se crea con una sublista inicial de 900 spots."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Código" required value={form.code} onChange={(e) => set("code", e.target.value)} />
          <Input label="Nombre" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <Input label="Dirección" value={form.address} onChange={(e) => set("address", e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Latitud"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => set("latitude", e.target.value)}
          />
          <Input
            label="Longitud"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => set("longitude", e.target.value)}
          />
          <Input
            label="Precio"
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Máx. spots (tienda)"
            type="number"
            min={1}
            value={form.maxSpots}
            onChange={(e) => set("maxSpots", e.target.value)}
          />
          <TimePicker
            label="Enciende"
            step={30}
            value={form.turnOnAt}
            onChange={(value) => set("turnOnAt", value)}
          />
          <TimePicker
            label="Apaga"
            step={30}
            value={form.turnOffAt}
            onChange={(value) => set("turnOffAt", value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Input
            label="Alias en las OP"
            placeholder="Ej. paseo general escalon, paseo escalon, paseo"
            value={form.aliases}
            onChange={(e) => set("aliases", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Separados por coma. Se usan para reconocer la pantalla al leer el PDF o Excel de una OP.
          </p>
        </div>
        <ImageUploader aspectRatio={16 / 9} onImageCropped={handleImage} />
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isBusy}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={isBusy}>
          {processingImage ? "Procesando imagen…" : screen ? "Guardar cambios" : "Crear pantalla"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function ScreenFormDialog({
  open,
  screenId,
  onClose,
}: {
  open: boolean;
  screenId: string | null;
  onClose: () => void;
}) {
  const { board } = usePantallas();
  const screen = screenId ? (board.screens.find((s) => s.id === screenId) ?? null) : null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size="lg">
        <ScreenForm key={screenId ?? "new"} screen={screen} onDone={onClose} />
      </DialogContent>
    </Dialog>
  );
}
