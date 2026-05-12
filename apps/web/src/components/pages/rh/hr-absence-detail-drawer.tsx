"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  CalendarDays,
  Clock,
  Download,
  FileText,
  ImageIcon,
  Loader2,
  Mail,
  User as UserIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { Absence, AbsenceStatus } from "@/api/absences/absences.types";
import { useUpdateAbsenceStatus } from "@/api/absences/absences.mutations";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Separator } from "@/components/primitives/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AbsenceStatusBadge,
  computeAbsenceDays,
} from "@/components/pages/absences";
import { formatLongDate } from "@/lib/format";
import { loadAbsencePdfImages } from "./absence-pdf-images";
import { AbsencePdfReport } from "./absence-pdf-report";

type HrAbsenceDetailDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  absence: Absence | null;
};

const STATUS_OPTIONS: { value: AbsenceStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "REJECTED", label: "Rechazada" },
];

function sanitizeFileName(input: string): string {
  return input.replace(/[\\/:*?"<>|]/g, "-").trim();
}

export function HrAbsenceDetailDrawer({
  open,
  onOpenChange,
  absence,
}: HrAbsenceDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent
        size="xl"
        className="data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw]"
      >
        {absence ? (
          <HrAbsenceDetailContent
            key={absence.id}
            absence={absence}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function HrAbsenceDetailContent({
  absence,
  onClose,
}: {
  absence: Absence;
  onClose: () => void;
}) {
  const updateStatusMutation = useUpdateAbsenceStatus();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const days = computeAbsenceDays(absence.fromDate, absence.toDate);
  const fullName =
    [absence.user.firstName, absence.user.lastName].filter(Boolean).join(" ") ||
    "Sin nombre";

  function handleStatusChange(next: string) {
    if (next === absence.status) return;
    updateStatusMutation.mutate(
      { id: absence.id, status: next as AbsenceStatus },
      {
        onSuccess: () => toast.success("Estado actualizado"),
        onError: (err: Error) =>
          toast.error(err.message || "Error al actualizar el estado"),
      },
    );
  }

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try {
      const pdfImages = await loadAbsencePdfImages(absence.images);
      const blob = await pdf(
        <AbsencePdfReport absence={absence} images={pdfImages} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const datePart = new Date(absence.fromDate).toISOString().slice(0, 10);
      const fileName = sanitizeFileName(
        `incapacidad-${fullName.replace(/\s+/g, "-").toLowerCase()}-${datePart}.pdf`,
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Reporte generado");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al generar el reporte",
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <DrawerTitle className="text-base font-semibold">
              Detalle de la incapacidad
            </DrawerTitle>
            <DrawerDescription className="flex items-center gap-1.5 text-xs">
              <CalendarDays className="size-3 shrink-0" />
              <span className="truncate">
                {days} {days === 1 ? "día" : "días"} de incapacidad
              </span>
            </DrawerDescription>
            <div className="pt-1.5">
              <AbsenceStatusBadge status={absence.status} />
            </div>
          </div>
          <PrimitiveButton
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 p-4">
          <Section
            icon={UserIcon}
            title="Empleado"
            description="Datos del usuario que generó la solicitud."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoCard label="Nombre" value={fullName} icon={UserIcon} />
              <InfoCard label="Correo" value={absence.user.email} icon={Mail} />
            </div>
          </Section>

          <Section
            icon={CalendarDays}
            title="Periodo"
            description="Rango de fechas de la incapacidad."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoCard
                label="Desde"
                value={formatLongDate(absence.fromDate)}
              />
              <InfoCard label="Hasta" value={formatLongDate(absence.toDate)} />
            </div>
          </Section>

          <Section
            icon={FileText}
            title="Motivo"
            description="Descripción ingresada por el empleado."
          >
            <p className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
              {absence.reason}
            </p>
          </Section>

          <Section
            icon={ImageIcon}
            title="Documentos"
            description={
              absence.images.length === 0
                ? "Esta solicitud no tiene archivos adjuntos."
                : `${absence.images.length} ${absence.images.length === 1 ? "archivo adjunto" : "archivos adjuntos"}.`
            }
          >
            {absence.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            ) : null}
          </Section>

          <Separator />

          <Section
            icon={CalendarDays}
            title="Cambiar estado"
            description="El estado puede ser modificado por el equipo de RR. HH."
          >
            <Select
              value={absence.status}
              onValueChange={handleStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="w-full sm:max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Separator />

          <MetadataRow absence={absence} />
        </div>
      </ScrollArea>

      <DrawerFooter className="flex-row items-center justify-end gap-2 border-t">
        <Button variant="outline" onClick={onClose} disabled={isGeneratingPdf}>
          Cerrar
        </Button>
        <Button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          icon={isGeneratingPdf ? Loader2 : Download}
          iconClassName={isGeneratingPdf ? "animate-spin" : undefined}
        >
          {isGeneratingPdf ? "Generando..." : "Descargar reporte"}
        </Button>
      </DrawerFooter>
    </>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border bg-accent/10 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {Icon ? <Icon className="size-3" /> : null}
        {label}
      </div>
      <span className="truncate text-sm font-semibold">{value}</span>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-3.5" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold leading-none">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="pl-8">{children}</div> : null}
    </section>
  );
}

function MetadataRow({ absence }: { absence: Absence }) {
  const items = [
    {
      icon: Clock,
      label: "Creada",
      value: formatLongDate(absence.createdAt),
    },
    {
      icon: Clock,
      label: "Actualizada",
      value: formatLongDate(absence.updatedAt),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-1 rounded-md border bg-accent/10 p-2.5"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <item.icon className="size-3" />
            {item.label}
          </div>
          <span className="truncate text-xs font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
