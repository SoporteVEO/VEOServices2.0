"use client";

import { useMemo, useState } from "react";
import NextImage from "next/image";
import {
  Calendar,
  Check,
  Download,
  Loader2,
  Pencil,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  S3_IMAGE_TYPE_BADGE_CLASSES,
  S3_IMAGE_TYPE_OPTIONS,
  S3_IMAGE_TYPE_SHORT_LABELS,
  type S3Image,
  type S3ImageType,
} from "@/api/s3-images/s3-images.get";
import {
  type UpdateS3ImageInput,
  useDeleteS3Image,
  useUpdateS3Image,
} from "@/api/s3-images/s3-images.post";
import { useStaticBillboardCodes } from "@/api/static-billboard-codes/static-billboard-codes.get";
import { Badge } from "@/components/primitives/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/primitives/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateStaticBillboardCodeDialog } from "./create-static-billboard-code-dialog";
import { RelatedImagesScroller } from "./related-images-scroller";

interface ImagePreviewDialogProps {
  image: S3Image | null;
  onOpenChange: (open: boolean) => void;
  onSelectImage?: (image: S3Image) => void;
  onImageUpdated?: (image: S3Image) => void;
  onImageDeleted?: (image: S3Image) => void;
}

export function ImagePreviewDialog({
  image,
  onOpenChange,
  onSelectImage,
  onImageUpdated,
  onImageDeleted,
}: ImagePreviewDialogProps) {
  const open = image !== null;

  const codeLabel = image?.staticBillboardCode?.code ?? "Sin código";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92dvh] w-full max-w-[min(96vw,1400px)] flex-col gap-0 overflow-hidden rounded-2xl bg-background p-0 sm:max-w-[min(96vw,1400px)]"
        showCloseButton
      >
        <DialogTitle className="sr-only">
          {`Vista previa de imagen ${codeLabel}`}
        </DialogTitle>

        {image ? (
          <ImagePreviewBody
            key={image.id}
            image={image}
            onSelectImage={onSelectImage}
            onImageUpdated={onImageUpdated}
            onImageDeleted={onImageDeleted}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface ImagePreviewBodyProps {
  image: S3Image;
  onSelectImage?: (image: S3Image) => void;
  onImageUpdated?: (image: S3Image) => void;
  onImageDeleted?: (image: S3Image) => void;
  onClose: () => void;
}

function ImagePreviewBody({
  image,
  onSelectImage,
  onImageUpdated,
  onImageDeleted,
  onClose,
}: ImagePreviewBodyProps) {
  const codeLabel = image.staticBillboardCode?.code ?? "Sin código";
  const userName = [image.uploadedUser.firstName, image.uploadedUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const updateMutation = useUpdateS3Image({
    onSuccess: (updated) => {
      toast.success("Imagen actualizada.");
      onImageUpdated?.(updated);
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo actualizar la imagen.");
    },
  });

  const deleteMutation = useDeleteS3Image({
    onSuccess: () => {
      toast.success("Imagen eliminada.");
      onImageDeleted?.(image);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "No se pudo eliminar la imagen.");
    },
  });

  function handleUpdate(input: UpdateS3ImageInput) {
    updateMutation.mutate({ id: image.id, ...input });
  }

  function handleDelete() {
    if (!confirm("¿Seguro que deseas eliminar esta imagen?")) return;
    deleteMutation.mutate(image.id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black md:flex-row">
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-black p-2 sm:p-4">
        <div className="relative aspect-4/3 max-h-full w-full max-w-full">
          <NextImage
            src={image.url}
            alt={`Imagen ${codeLabel}`}
            fill
            sizes="(min-width: 768px) 75vw, 100vw"
            unoptimized
            className="object-contain"
            priority
          />
        </div>
      </div>

      <aside className="flex max-h-[60dvh] shrink-0 flex-col gap-4 overflow-y-auto border-t bg-background p-5 md:max-h-none md:w-88 md:overflow-hidden md:border-l md:border-t-0">
        <CodeSection
          key={`code-${image.staticBillboardCodeId ?? "none"}`}
          image={image}
          isSaving={updateMutation.isPending}
          onSave={(staticBillboardCodeId) =>
            handleUpdate({ staticBillboardCodeId })
          }
        />

        <TypeSection
          key={`type-${image.type}`}
          image={image}
          isSaving={updateMutation.isPending}
          onSave={(type) => handleUpdate({ type })}
        />

        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-2.5 text-muted-foreground">
            <Calendar className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="text-foreground">
              {formatShortDate(new Date(image.createdAt))}
            </span>
          </li>
          {userName ? (
            <li className="flex items-start gap-2.5 text-muted-foreground">
              <User className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="text-foreground">{userName}</span>
            </li>
          ) : null}
          {image.tags.length > 0 ? (
            <li className="flex items-start gap-2.5 text-muted-foreground">
              <Tag className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="flex flex-wrap gap-1">
                {image.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </li>
          ) : null}
        </ul>

        {image.staticBillboardCodeId && onSelectImage ? (
          <RelatedImagesScroller
            staticBillboardCodeId={image.staticBillboardCodeId}
            currentImageId={image.id}
            onSelectImage={onSelectImage}
          />
        ) : null}

        <div className="mt-auto flex flex-col gap-2 border-t pt-4">
          <a
            href={image.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-card px-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Download className="size-4" aria-hidden />
            Abrir original
          </a>
          <Button
            variant="destructive"
            sizeVariant="lg"
            icon={deleteMutation.isPending ? Loader2 : Trash2}
            iconClassName={deleteMutation.isPending ? "animate-spin" : ""}
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="w-full justify-center"
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar imagen"}
          </Button>
        </div>
      </aside>
    </div>
  );
}

interface CodeSectionProps {
  image: S3Image;
  isSaving: boolean;
  onSave: (staticBillboardCodeId: string | null) => void;
}

function CodeSection({ image, isSaving, onSave }: CodeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftCodeId, setDraftCodeId] = useState<string | null>(
    image.staticBillboardCodeId,
  );
  const [createCodeOpen, setCreateCodeOpen] = useState(false);

  const { data: codes, isLoading: isLoadingCodes } = useStaticBillboardCodes();

  const codeOptions = useMemo(
    () =>
      (codes ?? []).map((code) => ({
        value: code.id,
        label: code.code,
      })),
    [codes],
  );

  const codeLabel = image.staticBillboardCode?.code ?? "Sin código";
  const isUnchanged = draftCodeId === image.staticBillboardCodeId;

  function handleStartEdit() {
    setDraftCodeId(image.staticBillboardCodeId);
    setIsEditing(true);
  }

  function handleCancel() {
    setDraftCodeId(image.staticBillboardCodeId);
    setIsEditing(false);
  }

  function handleSave() {
    if (isUnchanged) {
      setIsEditing(false);
      return;
    }
    onSave(draftCodeId);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Código
      </p>

      {isEditing ? (
        <div className="space-y-2">
          <Combobox
            placeholder="Selecciona un código"
            emptyLabel="No hay códigos creados."
            options={codeOptions}
            value={draftCodeId}
            isLoading={isLoadingCodes}
            onChange={(v) => setDraftCodeId(v == null ? null : String(v))}
            addLabel="Crear nuevo código"
            onAdd={() => setCreateCodeOpen(true)}
            triggerClassName="h-9 w-full"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              sizeVariant="md"
              icon={isSaving ? Loader2 : Check}
              iconClassName={isSaving ? "animate-spin" : ""}
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 justify-center"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              sizeVariant="md"
              icon={X}
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>

          <CreateStaticBillboardCodeDialog
            open={createCodeOpen}
            onOpenChange={setCreateCodeOpen}
            onCreated={(created) => setDraftCodeId(created.id)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="h-7 px-3 font-mono text-sm">
            {codeLabel}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            sizeVariant="sm"
            icon={Pencil}
            onClick={handleStartEdit}
            aria-label="Editar código"
          ></Button>
        </div>
      )}
    </div>
  );
}

interface TypeSectionProps {
  image: S3Image;
  isSaving: boolean;
  onSave: (type: S3ImageType) => void;
}

function TypeSection({ image, isSaving, onSave }: TypeSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftType, setDraftType] = useState<S3ImageType>(image.type);

  const typeLabel = S3_IMAGE_TYPE_SHORT_LABELS[image.type];
  const typeBadgeClass = S3_IMAGE_TYPE_BADGE_CLASSES[image.type];
  const isUnchanged = draftType === image.type;

  function handleStartEdit() {
    setDraftType(image.type);
    setIsEditing(true);
  }

  function handleCancel() {
    setDraftType(image.type);
    setIsEditing(false);
  }

  function handleSave() {
    if (isUnchanged) {
      setIsEditing(false);
      return;
    }
    onSave(draftType);
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tipo
      </p>

      {isEditing ? (
        <div className="space-y-2">
          <Select
            value={draftType}
            onValueChange={(v) => setDraftType(v as S3ImageType)}
          >
            <SelectTrigger className="h-9 w-full">
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
          <div className="flex items-center gap-2">
            <Button
              type="button"
              sizeVariant="md"
              icon={isSaving ? Loader2 : Check}
              iconClassName={isSaving ? "animate-spin" : ""}
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 justify-center"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              sizeVariant="md"
              icon={X}
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <Badge
            className={cn(
              "h-7 border-transparent px-3 text-sm font-medium",
              typeBadgeClass,
            )}
          >
            {typeLabel}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            sizeVariant="sm"
            icon={Pencil}
            onClick={handleStartEdit}
            aria-label="Editar tipo"
          ></Button>
        </div>
      )}
    </div>
  );
}
