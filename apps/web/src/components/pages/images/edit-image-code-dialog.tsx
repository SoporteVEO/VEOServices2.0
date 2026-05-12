"use client";

import { toast } from "sonner";
import { useUpdateS3Image } from "@/api/s3-images/s3-images.post";
import type { S3Image } from "@/api/s3-images/s3-images.get";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EditImageCodeForm,
  type EditImageCodeFormValues,
} from "./edit-image-code-form";

interface EditImageCodeDialogProps {
  image: S3Image | null;
  onOpenChange: (open: boolean) => void;
}

export function EditImageCodeDialog({
  image,
  onOpenChange,
}: EditImageCodeDialogProps) {
  const updateMutation = useUpdateS3Image({
    onSuccess: () => {
      toast.success("Código actualizado.");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo actualizar el código.");
    },
  });

  function handleSubmit(values: EditImageCodeFormValues) {
    if (!image) return;
    updateMutation.mutate({
      id: image.id,
      staticBillboardCodeId: values.staticBillboardCodeId,
    });
  }

  return (
    <Dialog open={image != null} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Editar código de la imagen</DialogTitle>
        </DialogHeader>

        {image ? (
          <EditImageCodeForm
            key={image.id}
            defaultStaticBillboardCode={image.staticBillboardCode}
            isPending={updateMutation.isPending}
            errorMessage={updateMutation.error?.message}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
