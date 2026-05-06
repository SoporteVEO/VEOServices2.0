"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/ui/image-uploader";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { useStaticBillboardCodes } from "@/api/static-billboard-codes/static-billboard-codes.get";
import {
  S3_IMAGE_TYPE_OPTIONS,
  type S3ImageType,
} from "@/api/s3-images/s3-images.get";
import { CreateStaticBillboardCodeDialog } from "./create-static-billboard-code-dialog";

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

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(blob);
  });
  return dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
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
  const [createCodeOpen, setCreateCodeOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: codes, isLoading: isLoadingCodes } = useStaticBillboardCodes();

  const codeOptions = useMemo(
    () =>
      (codes ?? []).map((code) => ({
        value: code.id,
        label: code.code,
      })),
    [codes],
  );

  async function handleImageReady(blob: Blob) {
    const base64 = await blobToBase64(blob);
    setImageBase64(base64);
    setValidationError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

  return (
    <>
      <form onSubmit={handleSubmit}>
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

          <Combobox
            label="Código de valla estática"
            placeholder="Selecciona un código"
            emptyLabel="No hay códigos creados."
            options={codeOptions}
            value={staticBillboardCodeId}
            isLoading={isLoadingCodes}
            onChange={(v) =>
              setStaticBillboardCodeId(v == null ? null : String(v))
            }
            addLabel="Crear nuevo código"
            onAdd={() => setCreateCodeOpen(true)}
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
            disabled={isPending}
            icon={isPending ? Loader2 : undefined}
            iconClassName={isPending ? "animate-spin" : undefined}
          >
            {isPending ? "Subiendo..." : "Subir imagen"}
          </Button>
        </DialogFooter>
      </form>

      <CreateStaticBillboardCodeDialog
        open={createCodeOpen}
        onOpenChange={setCreateCodeOpen}
        onCreated={(created) => setStaticBillboardCodeId(created.id)}
      />
    </>
  );
}
