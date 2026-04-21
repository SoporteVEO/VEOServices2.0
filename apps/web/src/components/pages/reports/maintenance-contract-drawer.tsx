"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ImageOff, ImagePlus, MapPin } from "lucide-react";
import type {
  ActiveContract,
  ActiveContractImage,
} from "@/api/contracts/contracts.get";
import type { S3Image } from "@/api/s3-images/s3-images.get";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ImagePreviewDialog } from "@/components/pages/images/image-preview-dialog";
import { formatShortDate } from "@/lib/format";
import type { MaintenanceContractGroup } from "./group";

function toS3ImagePreview(
  image: ActiveContractImage,
  billboardCode: string,
): S3Image {
  return {
    id: image.id,
    url: image.url,
    createdAt: image.createdAt,
    updatedAt: image.updatedAt,
    uploadedUserId: image.uploadedUser.id,
    uploadedUser: image.uploadedUser,
    tags: image.tags,
    type: image.type,
    staticBillboardCodeId: null,
    staticBillboardCode: { id: "", code: billboardCode },
  };
}

export function MaintenanceContractDrawer({
  group,
  onOpenChange,
}: {
  group: MaintenanceContractGroup | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [preview, setPreview] = useState<S3Image | null>(null);

  return (
    <>
      <Drawer
        open={!!group}
        onOpenChange={onOpenChange}
        direction="right"
        disablePreventScroll={true}
        handleOnly
      >
        <DrawerContent size="xl" className="flex flex-col">
          <DrawerHeader>
            <DrawerTitle>{group?.contractNumber ?? ""}</DrawerTitle>
            {group ? (
              <DrawerDescription>
                {group.customerName} · {group.customerEmail}
              </DrawerDescription>
            ) : null}
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-6">
            {group ? (
              <>
                <ContractSummary group={group} />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Vallas estáticas ({group.totalBillboards})
                  </h3>
                  {group.billboards.map((billboard) => (
                    <BillboardCard
                      key={billboard.contractDetailSourceId}
                      billboard={billboard}
                      onPreview={(image) =>
                        setPreview(
                          toS3ImagePreview(image, billboard.billboardCode),
                        )
                      }
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>

      <ImagePreviewDialog
        image={preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      />
    </>
  );
}

function ContractSummary({ group }: { group: MaintenanceContractGroup }) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
      <SummaryItem label="Atención">{group.description || "—"}</SummaryItem>
      <SummaryItem label="Inicio">
        {formatShortDate(new Date(group.startDate))}
      </SummaryItem>
      <SummaryItem label="Vencimiento">
        {formatShortDate(new Date(group.endDate))}
      </SummaryItem>
      <SummaryItem label="Imágenes subidas">
        <span className="font-medium tabular-nums">
          {group.billboardsWithImages} / {group.totalBillboards}
        </span>
      </SummaryItem>
    </div>
  );
}

function SummaryItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="truncate text-foreground">{children}</p>
    </div>
  );
}

function BillboardCard({
  billboard,
  onPreview,
}: {
  billboard: ActiveContract;
  onPreview: (image: ActiveContractImage) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {billboard.billboardCode || "Sin código"}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ImagePlus className="size-3" aria-hidden />
              {billboard.images.length}
            </Badge>
          </div>
          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span className="wrap-break-word">
              {billboard.billboardAddress || "—"}
            </span>
          </p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {formatShortDate(new Date(billboard.startDate))} —{" "}
          {formatShortDate(new Date(billboard.endDate))}
        </p>
      </div>

      <BillboardImages billboard={billboard} onPreview={onPreview} />
    </div>
  );
}

function BillboardImages({
  billboard,
  onPreview,
}: {
  billboard: ActiveContract;
  onPreview: (image: ActiveContractImage) => void;
}) {
  if (billboard.images.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
        <ImageOff className="size-4" aria-hidden />
        Sin imágenes para este período.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {billboard.images.map((image) => (
        <button
          key={image.id}
          type="button"
          onClick={() => onPreview(image)}
          className="group relative aspect-4/3 overflow-hidden rounded-md border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label={`Ver imagen subida el ${formatShortDate(new Date(image.createdAt))}`}
        >
          <NextImage
            src={image.url}
            alt={`Imagen ${billboard.billboardCode}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white">
            {formatShortDate(new Date(image.createdAt))}
          </div>
        </button>
      ))}
    </div>
  );
}
