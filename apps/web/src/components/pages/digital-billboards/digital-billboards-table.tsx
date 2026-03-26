"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageOff } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { formatMoney } from "@/lib/format";
import type { DigitalBillboard } from "@/api/digital-billboards/digital-billboards.get";
import {
  type DigitalBillboardInput,
  useDigitalBillboard,
} from "@/api/digital-billboards/digital-billboards.post";
import { CreateDigitalBillboardDialog } from "./create-digital-billboard-dialog";

export function DigitalBillboardsTable({
  rows,
  isLoading = false,
  onCreateSuccess,
  onCreateError,
}: {
  rows: DigitalBillboard[];
  isLoading?: boolean;
  onCreateSuccess?: () => void;
  onCreateError?: (error: Error) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const createMutation = useDigitalBillboard({
    onSuccess: () => {
      setOpen(false);
      onCreateSuccess?.();
    },
    onError: (error) => {
      onCreateError?.(error);
    },
  });

  function handleSubmit(values: DigitalBillboardInput) {
    createMutation.mutate(values);
  }

  const columns: ColumnDef<DigitalBillboard>[] = [
    {
      id: "image",
      header: () => <span className="sr-only">Imagen</span>,
      cell: ({ row }) => {
        const url = row.original.imageThumbnailUrl;
        if (!url) {
          return (
            <div className="flex size-12 items-center justify-center rounded-md border border-dashed bg-muted/50 text-muted-foreground">
              <ImageOff className="size-5" aria-hidden />
            </div>
          );
        }
        return (
          <Image
            src={url}
            alt={`Miniatura de ${row.original.name}`}
            width={48}
            height={48}
            unoptimized
            className="size-12 rounded-md border object-cover"
          />
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Nombre",
    },
    {
      accessorKey: "address",
      header: "Direccion",
      cell: ({ row }) => (
        <span className="block max-w-[200px] truncate">
          {row.original.address}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: () => <span className="block">Precio</span>,
      cell: ({ row }) => (
        <span className="block tabular-nums">
          {formatMoney(row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: "maxSpots",
      header: () => <span className="block">Max spots</span>,
      cell: ({ row }) => (
        <span className="block tabular-nums">{row.original.maxSpots}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateDigitalBillboardDialog
          open={open}
          onOpenChange={setOpen}
          isPending={createMutation.isPending}
          errorMessage={createMutation.error?.message}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="rounded-lg border">
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          onRowClick={(row) => {
            router.push(`/dashboard/digital-billboards/${row.id}`);
          }}
        />
      </div>
    </div>
  );
}
