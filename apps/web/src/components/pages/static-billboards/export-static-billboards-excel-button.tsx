"use client";

import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { formatMoney } from "@/lib/format";

function rowsToSheetData(rows: AvailableBillboardListing[]) {
  return rows.map((b) => {
    const location = [b.cityName, b.departmentName].filter(Boolean).join(", ");
    const dimensions =
      b.width == null && b.height == null
        ? ""
        : `${b.width ?? "—"} × ${b.height ?? "—"}`;
    const discount =
      b.availableDiscount != null && b.availableDiscount !== 0
        ? `-${b.availableDiscount}%`
        : "";
    return {
      Código: b.billboardCode ?? "",
      Referencia: b.reference ?? "",
      Ubicación: location || "—",
      Dirección: b.address ?? "",
      Dimensiones: dimensions,
      Precio: formatMoney(b.price),
      "Meses sin compra": b.monthsWithoutPurchase ?? "",
      Descuento: discount,
    };
  });
}

export function ExportStaticBillboardsExcelButton({
  rows,
  from,
  to,
  disabled,
}: {
  rows: AvailableBillboardListing[];
  from: string;
  to: string;
  disabled?: boolean;
}) {
  async function handleClick() {
    if (rows.length === 0) {
      toast.warning("No hay datos para exportar.");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rowsToSheetData(rows));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vallas");
      XLSX.writeFile(wb, `vallas-disponibles_${from}_${to}.xlsx`);
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
