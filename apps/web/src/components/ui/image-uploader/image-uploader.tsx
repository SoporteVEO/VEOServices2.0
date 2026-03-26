import NextImage from "next/image";
import { cn } from "@/lib/utils";
import { Trash2, Upload, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/ui/dialog";
import { Slider } from "@/components/primitives/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/primitives/ui/tooltip";

interface Point {
  x: number;
  y: number;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Props for the ImageUploader component
 */
interface ImageUploaderProps {
  /**
   * The aspect ratio of the cropped image (width / height)
   * @default 1 (square)
   */
  aspectRatio?: number;

  /**
   * Maximum file size in bytes
   * @default 5242880 (5MB)
   */
  maxSize?: number;

  /**
   * Allowed file types
   * @default ['image/jpeg', 'image/png', 'image/webp']
   */
  acceptedFileTypes?: string[];

  /**
   * CSS class name for the container
   */
  className?: string;

  /**
   * Callback function that returns the cropped image as a blob or file
   */
  onImageCropped?: (blob: Blob) => void;
}

/**
 * A reusable image uploader component with drag & drop, preview, and crop functionality
 */
export function ImageUploader({
  aspectRatio = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  className,
  onImageCropped,
}: ImageUploaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // We're not using a drop library like react-dropzone, so this is handled manually with DOM events

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    setError(null);

    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError(
        `Tipo de archivo no compatible. Tipos permitidos: ${acceptedFileTypes.join(", ")}`,
      );
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      setError(
        `El archivo es demasiado grande. Tamano maximo: ${maxSize / (1024 * 1024)}MB`,
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setIsCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const cropImage = useCallback(async () => {
    if (!image || !croppedAreaPixels) return;

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = image;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(
        img,
        croppedAreaPixels.x * scaleX,
        croppedAreaPixels.y * scaleY,
        croppedAreaPixels.width * scaleX,
        croppedAreaPixels.height * scaleY,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );

      canvas.toBlob((blob) => {
        if (blob) {
          const previewUrl = URL.createObjectURL(blob);
          setPreviewImage(previewUrl);
          if (onImageCropped) {
            onImageCropped(blob);
          }
          setIsCropDialogOpen(false);
        }
      }, "image/jpeg");
    }
  }, [image, croppedAreaPixels, onImageCropped]);

  const clearImage = () => {
    setPreviewImage(null);
    setImage(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Subir imagen
            <div className="flex gap-2">
              {previewImage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={clearImage}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Limpiar imagen</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!previewImage ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/20 transition-colors"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={acceptedFileTypes.join(",")}
                onChange={(e) =>
                  handleFileSelect(e.target.files ? e.target.files[0] : null)
                }
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Arrastra una imagen aqui o haz clic para seleccionar
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {`Formatos permitidos: ${acceptedFileTypes.map((type) => type.replace("image/", ".")).join(", ")}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {`Tamano maximo: ${maxSize / (1024 * 1024)}MB`}
              </p>
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden">
              <NextImage
                src={previewImage}
                alt="Vista previa recortada"
                width={1200}
                height={1200}
                unoptimized
                className="w-full h-auto rounded-lg object-cover aspect-ratio-1/1"
                style={{ aspectRatio: aspectRatio }}
              />
              <Button
                className="absolute bottom-4 right-4"
                onClick={() => setIsCropDialogOpen(true)}
              >
                Editar
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            Carga una imagen para verla y recortarla
          </p>
        </CardFooter>
      </Card>

      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recortar imagen</DialogTitle>
          </DialogHeader>
          {image && (
            <>
              <div className="relative w-full h-80">
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                />
                <ZoomIn className="h-4 w-4" />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCropDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={cropImage}>Aplicar</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
