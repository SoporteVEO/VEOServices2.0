"use client";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

interface ImageViewerProps {
  className?: string;
  classNameImageViewer?: string;
  classNameThumbnailViewer?: string;
  imageTitle?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  onThumbnailLoad?: () => void;
}

const ImageViewer_Motion = ({
  className,
  classNameImageViewer,
  classNameThumbnailViewer,
  imageTitle,
  imageUrl,
  thumbnailUrl,
  onThumbnailLoad,
}: ImageViewerProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={cn("cursor-pointer", className)}>
          <img
            src={thumbnailUrl || imageUrl}
            alt=""
            className={cn(
              "rounded-lg object-cover transition-opacity hover:opacity-90",
              classNameThumbnailViewer ??
                "mx-auto h-[300px] w-full max-w-[300px]",
            )}
            onLoad={onThumbnailLoad}
          />
        </div>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="motion-preset-fade motion-duration-150 fixed inset-0 z-50 bg-black/80" />
        <DialogContent className="bg-background motion-scale-in-[0.5] motion-rotate-in-[-10deg] motion-blur-in-[5px] motion-duration-150 motion-duration-150/scale motion-duration-150/translate motion-duration-[0.00s]/rotate fixed inset-0 z-50 flex flex-col items-center justify-center p-0">
          <DialogTitle className="sr-only">
            {imageTitle ?? "Imagen ampliada"}
          </DialogTitle>
          <div className="relative flex h-screen w-screen items-center justify-center">
            <TransformWrapper
              initialScale={1}
              initialPositionX={0}
              initialPositionY={0}
            >
              {() => (
                <>
                  <TransformComponent>
                    <img
                      src={imageUrl}
                      alt={imageTitle ?? "Imagen ampliada"}
                      draggable={false}
                      className={cn(
                        "max-h-[90vh] max-w-[95vw] select-none object-contain",
                        classNameImageViewer,
                      )}
                    />
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
            <DialogClose asChild>
              <button
                className="absolute top-4 end-4 z-10 cursor-pointer rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                aria-label="Close"
              >
                <X className="size-6" />
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ImageViewer_Motion;
