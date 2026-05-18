"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/ui/image-uploader";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import {
  S3_IMAGE_TYPE_OPTIONS,
  type S3ImageType,
} from "@/api/s3-images/s3-images.get";
import { blobToBase64, compressImage } from "@/lib/compress-image";
import { StaticBillboardCodeCombobox } from "./static-billboard-code-combobox";

export interface UploadImageFormValues {
  imageBase64: string;
  type: S3ImageType;
  staticBillboardCodeId: string | null;
}

interface UploadImageFormProps {
  defaultType?: S3ImageType;
  isPending?: boolean;
  errorMessage?: string;
  onSubmit: (values: UploadImageFormValues) => void;
  onCancel: () => void;
}

export function UploadImageForm({
  defaultType = "STATIC_BILLBOARD_MONTHLY",
  isPending = false,
  errorMessage,
  onSubmit,
  onCancel,
}: UploadImageFormProps) {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [type, setType] = useState<S3ImageType>(defaultType);
  const [staticBillboardCodeId, setStaticBillboardCodeId] = useState<
    string | null
  >(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  async function handleImageReady(blob: Blob) {
    setValidationError(null);
    setIsCompressing(true);
    setImageBase64(null);
    try {
      const compressed = await compressImage(blob);
      const base64 = await blobToBase64(compressed.blob);
      setImageBase64(base64);
    } catch (err) {
      setValidationError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar la imagen. Intenta con otra.",
      );
    } finally {
      setIsCompressing(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isCompressing) {
      setValidationError("Espera a que termine de procesarse la imagen.");
      return;
    }
    if (!imageBase64) {
      setValidationError("Debes subir una imagen primero.");
      return;
    }

    onSubmit({
      imageBase64,
      type,
      staticBillboardCodeId,
    });
  }

  const isSubmitDisabled = isPending || isCompressing;
  const submitLabel = isCompressing
    ? "Procesando imagen..."
    : isPending
      ? "Subiendo..."
      : "Subir imagen";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogBody className="space-y-4">
        <Select
          label="Tipo de imagen"
          value={type}
          onValueChange={(v) => setType(v as S3ImageType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {S3_IMAGE_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <StaticBillboardCodeCombobox
          label="Código de valla estática"
          value={staticBillboardCodeId}
          onChange={setStaticBillboardCodeId}
        />

        <ImageUploader disableCrop onImageCropped={handleImageReady} />

        {validationError ? (
          <p className="text-sm text-destructive">{validationError}</p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          icon={isSubmitDisabled ? Loader2 : undefined}
          iconClassName={isSubmitDisabled ? "animate-spin" : undefined}
        >
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
