"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { OfferListItem } from "@/api/offers/offers.types";
import { formatBriloShortDate, formatMoney } from "@/lib/format";
import { MyOfferActions } from "./my-offer-actions";
import { MyOfferStatusBadge } from "./my-offer-status-badge";

export const MY_OFFERS_COLUMNS: ColumnDef<OfferListItem>[] = [
  {
    accessorKey: "offerNumber",
    header: "Cotización",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.offerNumber}</span>
    ),
  },
  {
    accessorKey: "customerName",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate">{row.original.customerName}</p>
        {row.original.customerCompany ? (
          <p className="truncate text-xs text-muted-foreground">
            {row.original.customerCompany}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "totalRental",
    header: "Total arrendamiento",
    cell: ({ row }) => formatMoney(row.original.totalRental),
  },
  {
    accessorKey: "validUntil",
    header: "Vigencia",
    cell: ({ row }) => formatBriloShortDate(row.original.validUntil),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <MyOfferStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <MyOfferActions offer={row.original} />,
    enableSorting: false,
  },
];
