"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useS3Images } from "@/api/s3-images/s3-images.get";
import { Button } from "@/components/ui/button";
import { ImagesGrid, UploadImageDialog } from "@/components/pages/images";

export default function ImagesPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: images = [], isLoading } = useS3Images();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Imágenes</h1>
        </div>

        <Button icon={Plus} onClick={() => setUploadOpen(true)}>
          Subir imagen
        </Button>
      </div>

      <ImagesGrid images={images} isLoading={isLoading} />

      <UploadImageDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
