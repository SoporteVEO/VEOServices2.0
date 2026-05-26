"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/primitives/ui/badge";
import type { OfferDetailItem } from "@/api/offers/offers.types";
import {
  formatBriloShortDate,
  formatDimensions,
  formatMoney,
} from "@/lib/format";

export const MY_OFFER_ITEMS_COLUMNS: ColumnDef<OfferDetailItem>[] = [
  {
    accessorKey: "billboardCode",
    header: "Código",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono whitespace-nowrap">
        {row.original.billboardCode ?? "—"}
      </Badge>
    ),
  },
  {
    id: "location",
    header: "Ubicación",
    cell: ({ row }) => {
      const item = row.original;
      const location =
        [item.address, item.cityName, item.departmentName]
          .filter(Boolean)
          .join(", ") || "—";
      return (
        <p className="line-clamp-2 max-w-[260px] text-xs text-foreground/90">
          {location}
        </p>
      );
    },
  },
  {
    id: "dimensions",
    header: "Medidas",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs tabular-nums">
        {formatDimensions(row.original.width, row.original.height)}
      </span>
    ),
  },
  {
    id: "period",
    header: "Vigencia",
    cell: ({ row }) => {
      const { startDate, endDate } = row.original;
      if (!startDate || !endDate) {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      return (
        <span className="whitespace-nowrap text-xs tabular-nums">
          {formatBriloShortDate(startDate)} – {formatBriloShortDate(endDate)}
        </span>
      );
    },
  },
  {
    accessorKey: "rentalPrice",
    header: () => <div className="text-right">Arrendamiento</div>,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right text-xs font-medium tabular-nums">
        {formatMoney(row.original.rentalPrice)}
      </div>
    ),
  },
  {
    accessorKey: "impressionPrice",
    header: () => <div className="text-right">Impresión</div>,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right text-xs font-medium tabular-nums">
        {formatMoney(row.original.impressionPrice)}
      </div>
    ),
  },
];
