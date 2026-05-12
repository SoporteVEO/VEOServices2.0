"use client";

import type { Absence } from "@/api/absences/absences.types";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";

type AbsenceImagesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  absence: Absence | null;
};

export function AbsenceImagesDialog({
  open,
  onOpenChange,
  absence,
}: AbsenceImagesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            Documentos de la incapacidad
          </DialogTitle>
          {absence ? (
            <DialogDescription>
              {formatDate(absence.fromDate)} – {formatDate(absence.toDate)}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <DialogBody>
          {absence && absence.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {absence.images.map((image) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-md border bg-muted/30 transition-opacity hover:opacity-90"
                >
                  <img
                    src={image.url}
                    alt="Documento de la incapacidad"
                    className="aspect-square size-full object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Esta incapacidad no tiene documentos adjuntos.
            </p>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
