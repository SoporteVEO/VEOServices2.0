"use client";

import Image from "next/image";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

export function FleetVehiclePhoto({
  url,
  alt,
  className,
  sizes = "64px",
}: {
  url: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-muted-foreground",
        className,
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          className="object-cover"
          sizes={sizes}
        />
      ) : (
        <Car className="size-1/2 max-h-10 max-w-10" aria-hidden />
      )}
    </div>
  );
}
