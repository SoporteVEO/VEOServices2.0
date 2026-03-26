"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DigitalBillboardInput } from "@/api/digital-billboards/digital-billboards.post";
import { DigitalBillboardForm } from "./digital-billboard-form";

interface CreateDigitalBillboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending?: boolean;
  errorMessage?: string;
  onSubmit: (values: DigitalBillboardInput) => void;
}

export function CreateDigitalBillboardDialog({
  open,
  onOpenChange,
  isPending = false,
  errorMessage,
  onSubmit,
}: CreateDigitalBillboardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button icon={Plus}>Nueva valla</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Nueva valla digital</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <DigitalBillboardForm
            isPending={isPending}
            errorMessage={errorMessage}
            onSubmit={onSubmit}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
