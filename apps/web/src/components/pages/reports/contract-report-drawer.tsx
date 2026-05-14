"use client";

import { useMemo, useState } from "react";
import NextImage from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Eye, ImageOff, ImagePlus, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import type {
  ActiveContract,
  ActiveContractGroup,
  ActiveContractImage,
} from "@/api/contracts/contracts.get";
import {
  createReportUploadUrl,
  sendMaintenanceReport,
} from "@/api/contracts/contracts.post";
import type { S3Image } from "@/api/s3-images/s3-images.get";
import { Badge } from "@/components/primitives/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ImagePreviewDialog } from "@/components/pages/images/image-preview-dialog";
import { formatShortDate } from "@/lib/format";
import {
  generateContractReport,
  type ContractReportProgress,
} from "@/lib/generate-contract-report";
import { uploadBlobToPresignedUrl } from "@/lib/upload-blob-to-presigned-url";
import { cn } from "@/lib/utils";
import { SendReportDialog } from "./send-report-dialog";
import { REPORT_TYPE_CONFIG, type ReportType } from "./report-types";

const REPORT_FILE_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

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

export function ContractReportDrawer({
  group,
  reportType,
  onOpenChange,
}: {
  group: ActiveContractGroup | null;
  reportType: ReportType;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer
      open={!!group}
      onOpenChange={onOpenChange}
      direction="right"
      disablePreventScroll={true}
      handleOnly
    >
      <DrawerContent size="xl" className="flex flex-col">
        {group ? (
          <ContractReportDrawerContent
            key={`${reportType}-${group.contractNumber}`}
            group={group}
            reportType={reportType}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function ContractReportDrawerContent({
  group,
  reportType,
}: {
  group: ActiveContractGroup;
  reportType: ReportType;
}) {
  const config = REPORT_TYPE_CONFIG[reportType];
  const queryClient = useQueryClient();

  const [preview, setPreview] = useState<S3Image | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<
    Record<number, string | null>
  >(() => buildInitialSelection(group));
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState<ContractReportProgress | null>(null);

  const stats = useMemo(() => {
    const billboardsWithImages = group.billboards.filter(
      (b) => b.images.length > 0,
    ).length;
    const billboardsSelected = group.billboards.filter(
      (b) => selectedImageIds[b.contractDetailSourceId],
    ).length;
    return { billboardsWithImages, billboardsSelected };
  }, [group, selectedImageIds]);

  function handleSelectImage(billboardId: number, imageId: string) {
    setSelectedImageIds((prev) => ({
      ...prev,
      [billboardId]: prev[billboardId] === imageId ? null : imageId,
    }));
  }

  async function handleSendReport(email: string) {
    setIsSending(true);
    setProgress({ stage: "Preparando", current: 0, total: 1 });

    try {
      const reportBillboards = group.billboards.map((billboard) => {
        const selectedImageId =
          selectedImageIds[billboard.contractDetailSourceId];
        const selectedImage = selectedImageId
          ? (billboard.images.find((img) => img.id === selectedImageId) ?? null)
          : null;

        return {
          billboardCode: billboard.billboardCode,
          billboardAddress: billboard.billboardAddress ?? "",
          latitude: billboard.billboardLatitude,
          longitude: billboard.billboardLongitude,
          imageUrl: selectedImage?.url ?? null,
          imageCreatedAt: selectedImage?.createdAt ?? null,
        };
      });

      const { blob, fileName, period } = await generateContractReport({
        contractNumber: group.contractNumber,
        customerName: group.customerName ?? "",
        customerEmail: group.customerEmail ?? "",
        description: group.description ?? "",
        dateFrom: new Date(group.startDate),
        dateTo: new Date(group.endDate),
        billboards: reportBillboards,
        coverTitle: config.coverTitle,
        fileNamePrefix: config.fileNamePrefix,
        onProgress: setProgress,
      });

      setProgress({ stage: "Subiendo reporte", current: 0, total: 1 });
      const { key, url } = await createReportUploadUrl();
      await uploadBlobToPresignedUrl({
        url,
        blob,
        contentType: REPORT_FILE_MIME_TYPE,
      });

      setProgress({ stage: "Enviando email", current: 0, total: 1 });
      await sendMaintenanceReport({
        email,
        contractNumber: group.contractNumber,
        customerName: group.customerName ?? "",
        description: group.description ?? undefined,
        period,
        fileName,
        fileKey: key,
        reportType,
      });

      toast.success(`Reporte enviado a ${email}.`);
      queryClient.invalidateQueries({ queryKey: ["notifications", "active"] });
      setIsSendOpen(false);
    } catch (error) {
      console.error("Error sending contract report:", error);
      toast.error("No se pudo enviar el reporte.");
    } finally {
      setIsSending(false);
      setProgress(null);
    }
  }

  const progressLabel = progress
    ? `${progress.stage}${progress.total > 1 ? ` (${progress.current}/${progress.total})` : "…"}`
    : null;

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{group.contractNumber}</DrawerTitle>
        <DrawerDescription>
          {[group.customerName, group.customerEmail].filter(Boolean).join(" · ") ||
            "Sin cliente"}
        </DrawerDescription>
      </DrawerHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        <ContractSummary group={group} />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Vallas estáticas ({group.totalBillboards})
            </h3>
            <p className="text-xs text-muted-foreground">
              Toca una imagen para incluirla en el reporte
            </p>
          </div>
          {group.billboards.map((billboard) => (
            <BillboardCard
              key={billboard.contractDetailSourceId}
              billboard={billboard}
              emptyMessage={config.emptyImagesMessage}
              selectedImageId={
                selectedImageIds[billboard.contractDetailSourceId] ?? null
              }
              onSelectImage={(imageId) =>
                handleSelectImage(billboard.contractDetailSourceId, imageId)
              }
              onPreview={(image) =>
                setPreview(toS3ImagePreview(image, billboard.billboardCode))
              }
            />
          ))}
        </div>
      </div>

      <DrawerFooter className="border-t bg-muted/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {stats.billboardsSelected}
              </span>{" "}
              de <span className="tabular-nums">{group.totalBillboards}</span>{" "}
              vallas con imagen seleccionada
            </p>
            <p className="text-[11px] text-muted-foreground">
              Solo se incluirán en el reporte las vallas con imagen
              seleccionada.
            </p>
          </div>
          <Button
            sizeVariant="lg"
            onClick={() => setIsSendOpen(true)}
            disabled={isSending}
            icon={Send}
          >
            Generar reporte
          </Button>
        </div>
      </DrawerFooter>

      <SendReportDialog
        open={isSendOpen}
        onOpenChange={setIsSendOpen}
        defaultEmail={group.customerEmail}
        contractNumber={group.contractNumber}
        totalBillboardsCount={group.totalBillboards}
        selectedImagesCount={stats.billboardsSelected}
        isSubmitting={isSending}
        progressLabel={progressLabel}
        onSubmit={handleSendReport}
      />

      <ImagePreviewDialog
        image={preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      />
    </>
  );
}

function buildInitialSelection(
  group: ActiveContractGroup,
): Record<number, string | null> {
  const initial: Record<number, string | null> = {};
  for (const billboard of group.billboards) {
    const mostRecent = billboard.images[0];
    initial[billboard.contractDetailSourceId] = mostRecent?.id ?? null;
  }
  return initial;
}

function ContractSummary({ group }: { group: ActiveContractGroup }) {
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
  emptyMessage,
  selectedImageId,
  onSelectImage,
  onPreview,
}: {
  billboard: ActiveContract;
  emptyMessage: string;
  selectedImageId: string | null;
  onSelectImage: (imageId: string) => void;
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

      <BillboardImages
        billboard={billboard}
        emptyMessage={emptyMessage}
        selectedImageId={selectedImageId}
        onSelectImage={onSelectImage}
        onPreview={onPreview}
      />
    </div>
  );
}

function BillboardImages({
  billboard,
  emptyMessage,
  selectedImageId,
  onSelectImage,
  onPreview,
}: {
  billboard: ActiveContract;
  emptyMessage: string;
  selectedImageId: string | null;
  onSelectImage: (imageId: string) => void;
  onPreview: (image: ActiveContractImage) => void;
}) {
  if (billboard.images.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/20 px-3 py-4 text-xs text-muted-foreground">
        <ImageOff className="size-4" aria-hidden />
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {billboard.images.map((image) => {
        const isSelected = selectedImageId === image.id;
        return (
          <SelectableImage
            key={image.id}
            image={image}
            billboardCode={billboard.billboardCode}
            isSelected={isSelected}
            onSelect={() => onSelectImage(image.id)}
            onPreview={() => onPreview(image)}
          />
        );
      })}
    </div>
  );
}

function SelectableImage({
  image,
  billboardCode,
  isSelected,
  onSelect,
  onPreview,
}: {
  image: ActiveContractImage;
  billboardCode: string;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative aspect-4/3 overflow-hidden rounded-md border bg-muted transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/40"
          : "border-border hover:border-muted-foreground/40",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isSelected}
        aria-label={
          isSelected
            ? `Quitar imagen del ${formatShortDate(new Date(image.createdAt))} del reporte`
            : `Incluir imagen del ${formatShortDate(new Date(image.createdAt))} en el reporte`
        }
        className="absolute inset-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <NextImage
          src={image.url}
          alt={`Imagen ${billboardCode}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          unoptimized
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-[1.04]",
            !isSelected && "opacity-90",
          )}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-white">
          {formatShortDate(new Date(image.createdAt))}
        </div>
      </button>

      <div
        className={cn(
          "pointer-events-none absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full border-2 transition-all",
          isSelected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-white/80 bg-black/30 text-transparent backdrop-blur-sm group-hover:bg-black/40",
        )}
        aria-hidden
      >
        <Check className="size-3.5" strokeWidth={3} />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPreview();
        }}
        aria-label="Vista previa de imagen"
        className="absolute right-1.5 top-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 group-hover:opacity-100"
      >
        <Eye className="size-3.5" />
      </button>
    </div>
  );
}
