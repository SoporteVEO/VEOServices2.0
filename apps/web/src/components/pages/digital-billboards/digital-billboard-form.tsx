"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import type { DigitalBillboardInput } from "@/api/digital-billboards/digital-billboards.post";
import { blobToBase64, compressImage } from "@/lib/compress-image";

interface DigitalBillboardFormProps {
  isPending?: boolean;
  errorMessage?: string;
  onSubmit: (values: DigitalBillboardInput) => void;
}

export function DigitalBillboardForm({
  isPending = false,
  errorMessage,
  onSubmit,
}: DigitalBillboardFormProps) {
  const { register, handleSubmit, setValue } = useForm<DigitalBillboardInput>({
    defaultValues: {
      maxSpots: 900,
      imageBase64: null,
    },
  });
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  async function handleImageCropped(blob: Blob) {
    setImageError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImage(blob);
      const base64 = await blobToBase64(compressed.blob);
      setValue("imageBase64", base64, { shouldDirty: true });
    } catch (err) {
      setImageError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar la imagen. Intenta con otra.",
      );
    } finally {
      setIsCompressing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Input
            id="code"
            label="Codigo"
            {...register("code", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <Input
            id="name"
            label="Nombre"
            {...register("name", { required: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Input
          id="address"
          label="Direccion"
          {...register("address", { required: true })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Input
            id="latitude"
            label="Latitud"
            {...register("latitude", { required: true, valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Input
            id="longitude"
            label="Longitud"
            {...register("longitude", { required: true, valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Input
            id="price"
            label="Precio"
            {...register("price", { required: true })}
          />
        </div>
      </div>

      <Input
        id="maxSpots"
        label="Max spots"
        {...register("maxSpots", {
          required: true,
          valueAsNumber: true,
          min: 1,
        })}
      />

      <div className="space-y-2">
        <input type="hidden" {...register("imageBase64")} />
        <ImageUploader
          aspectRatio={16 / 9}
          onImageCropped={handleImageCropped}
        />
        {imageError ? (
          <p className="text-sm text-destructive">{imageError}</p>
        ) : null}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || isCompressing}
      >
        {isCompressing
          ? "Procesando imagen..."
          : isPending
            ? "Creando..."
            : "Crear valla"}
      </Button>

      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
    </form>
  );
}
