"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import { Button } from "@/components/ui/button";
import { GenerateQuotationModal } from "./generate-quotation-modal";

const VEO_LOGO_SRC = "/VEO_LOGO_COT.png";

export interface GenerateQuotationButtonProps {
  selectedRows: AvailableBillboardListing[];
  /** Default duration applied to each billboard item (taken from the page-level date range). */
  defaultStartDate?: Date | null;
  defaultEndDate?: Date | null;
  onSuccess?: () => void;
}

export function GenerateQuotationButton({
  selectedRows,
  defaultStartDate,
  defaultEndDate,
  onSuccess,
}: GenerateQuotationButtonProps) {
  const [open, setOpen] = useState(false);

  if (selectedRows.length === 0) return null;

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="default"
        icon={FileText}
        onClick={() => setOpen(true)}
      >
        Generar Cotización ({selectedRows.length})
      </Button>
      {open ? (
        <GenerateQuotationModal
          open={open}
          onOpenChange={setOpen}
          billboards={selectedRows}
          logoSrc={VEO_LOGO_SRC}
          defaultStartDate={defaultStartDate}
          defaultEndDate={defaultEndDate}
          onSuccess={onSuccess}
        />
      ) : null}
    </>
  );
}
