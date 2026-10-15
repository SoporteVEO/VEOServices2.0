import Image from "next/image";
import type { InventoryItem } from "@/api/crm/crm-ooh.types";
import { cn } from "@/lib/utils";
import { formatIconSrc, formatLabel } from "./inventory-format";

interface Props {
  item: Pick<InventoryItem, "kind" | "formatCode" | "structureName">;
  size?: number;
  className?: string;
}

export function OohFormatIcon({ item, size = 20, className }: Props) {
  return (
    <Image
      src={formatIconSrc(item)}
      alt={formatLabel(item)}
      width={size}
      height={size}
      unoptimized
      draggable={false}
      className={cn("shrink-0 object-contain select-none", className)}
    />
  );
}
