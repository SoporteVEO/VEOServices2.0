"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerateOfferModal } from "./generate-offer-modal";

export interface GenerateOfferButtonProps {
  onSuccess?: () => void;
  disabled?: boolean;
}

export function GenerateOfferButton({
  onSuccess,
  disabled,
}: GenerateOfferButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="default"
        icon={FileText}
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        Generar Cotización
      </Button>
      {open ? (
        <GenerateOfferModal
          open={open}
          onOpenChange={setOpen}
          onSuccess={onSuccess}
        />
      ) : null}
    </>
  );
}
