"use client";

import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { formatMoney } from "@/lib/format";

function rowsToSheetData(
  rows: AvailableBillboardListing[],
  includeAvailabilityColumn: boolean,
) {
  return rows.map((b) => {
    const location = [b.cityName, b.departmentName].filter(Boolean).join(", ");
    const dimensions =
      b.width == null && b.height == null
        ? ""
        : `${b.width ?? "—"} × ${b.height ?? "—"}`;
    const base: Record<string, string | number> = {
      Código: b.billboardCode ?? "",
      Referencia: b.reference ?? "",
      Ubicación: location || "—",
      Dirección: b.address ?? "",
      Dimensiones: dimensions,
      Precio: formatMoney(b.price),
      "Meses sin compra": b.monthsWithoutPurchase ?? "",
    };
    if (includeAvailabilityColumn) {
      base.Disponibilidad = b.isAvailable ? "Disponible" : "Ocupada";
    } else {
      base.Descuento =
        b.availableDiscount != null && b.availableDiscount !== 0
          ? `-${b.availableDiscount}%`
          : "";
    }
    return base;
  });
}

export function ExportStaticBillboardsExcelButton({
  rows,
  from,
  to,
  disabled,
  includeAvailabilityColumn = false,
}: {
  rows: AvailableBillboardListing[];
  from: string;
  to: string;
  disabled?: boolean;
  includeAvailabilityColumn?: boolean;
}) {
  async function handleClick() {
    if (rows.length === 0) {
      toast.warning("No hay datos para exportar.");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(
        rowsToSheetData(rows, includeAvailabilityColumn),
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vallas");
      const fileNamePrefix = includeAvailabilityColumn
        ? "vallas"
        : "vallas-disponibles";
      XLSX.writeFile(wb, `${fileNamePrefix}_${from}_${to}.xlsx`);
      toast.success("Archivo descargado.");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo exportar a Excel.");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      disabled={disabled}
      onClick={() => void handleClick()}
    >
      <FileSpreadsheet />
      Exportar Excel
    </Button>
  );
}
