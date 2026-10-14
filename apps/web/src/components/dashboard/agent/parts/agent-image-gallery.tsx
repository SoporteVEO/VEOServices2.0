"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Images } from "lucide-react";
import {
  getS3ImagesPage,
  S3_IMAGE_TYPE_SHORT_LABELS,
} from "@/api/s3-images/s3-images.get";
import type { AgentImage, AgentImagesOutput } from "@/api/agent/agent.types";
import { formatShortDate } from "@/lib/format";
import { AgentImageDialog } from "./agent-image-dialog";
import { AgentPartFrame } from "./agent-part-frame";

/** S3 signed URLs expire after 7 days. */
const SIGNED_URL_TTL_MS = 6 * 24 * 60 * 60 * 1000;

async function refreshImages(output: AgentImagesOutput): Promise<AgentImage[]> {
  const count = Math.max(output.images.length, 1);
  const page = await getS3ImagesPage({
    code: output.code,
    type: output.type ?? undefined,
    sortOrder: "desc",
    limit: Math.min(count * 3, 100),
  });
  const code = output.code.toUpperCase();
  return page.data
    .filter((image) => image.staticBillboardCode?.code.toUpperCase() === code)
    .slice(0, count)
    .map((image) => ({
      id: image.id,
      url: image.url,
      createdAt: image.createdAt,
      type: image.type,
      code: image.staticBillboardCode?.code ?? null,
      uploadedBy:
        [image.uploadedUser.firstName, image.uploadedUser.lastName]
          .filter(Boolean)
          .join(" ") || image.uploadedUser.email,
    }));
}

export function AgentImageGallery({ output }: { output: AgentImagesOutput }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const { data: images = output.images } = useQuery({
    queryKey: ["agent", "images", output.code, output.type, output.fetchedAt],
    queryFn: () => refreshImages(output),
    initialData: output.images,
    initialDataUpdatedAt: Date.parse(output.fetchedAt),
    staleTime: SIGNED_URL_TTL_MS,
  });

  if (images.length === 0) {
    return (
      <AgentPartFrame
        icon={Images}
        title={`Imágenes de ${output.code}`}
        description="No se encontraron imágenes para este código."
      />
    );
  }

  return (
    <AgentPartFrame
      icon={Images}
      title={`Imágenes de ${output.code}`}
      description={`${images.length} ${images.length === 1 ? "imagen" : "imágenes"} · más recientes primero`}
    >
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group relative aspect-4/3 overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label={`Ver imagen ${index + 1}`}
          >
            <NextImage
              src={image.url}
              alt={`Imagen ${image.code ?? ""}`}
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-6 text-left text-[11px] text-white">
              {formatShortDate(new Date(image.createdAt))} ·{" "}
              {S3_IMAGE_TYPE_SHORT_LABELS[image.type]}
            </span>
          </button>
        ))}
      </div>
      <AgentImageDialog
        images={images}
        index={openIndex}
        onIndexChange={setOpenIndex}
      />
    </AgentPartFrame>
  );
}
