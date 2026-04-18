"use client";

import { toast } from "sonner";
import { useCreateS3Image } from "@/api/s3-images/s3-images.post";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UploadImageForm,
  type UploadImageFormValues,
} from "./upload-image-form";

interface UploadImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadImageDialog({
  open,
  onOpenChange,
}: UploadImageDialogProps) {
  const createMutation = useCreateS3Image({
    onSuccess: () => {
      toast.success("Imagen subida correctamente.");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo subir la imagen.");
    },
  });

  function handleSubmit(values: UploadImageFormValues) {
    createMutation.mutate({
      imageBase64: values.imageBase64,
      type: values.type,
      staticBillboardCodeId: values.staticBillboardCodeId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Subir nueva imagen</DialogTitle>
        </DialogHeader>

        <UploadImageForm
          key={String(open)}
          isPending={createMutation.isPending}
          errorMessage={createMutation.error?.message}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
