"use client";

import { toast } from "sonner";
import { useDigitalBillboards } from "@/api/digital-billboards/digital-billboards.get";
import { DigitalBillboardsTable } from "@/components/pages/digital-billboards";

export default function DigitalBillboardsPage() {
  const { data, isLoading } = useDigitalBillboards();

  return (
    <section>
      <DigitalBillboardsTable
        rows={data ?? []}
        isLoading={isLoading}
        onCreateSuccess={() =>
          toast.success("Valla digital creada correctamente.")
        }
        onCreateError={(error) =>
          toast.error(error.message || "No se pudo crear la valla digital.")
        }
      />
    </section>
  );
}
