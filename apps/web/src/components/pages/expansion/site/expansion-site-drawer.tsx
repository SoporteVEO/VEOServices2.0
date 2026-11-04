"use client";

import { useState } from "react";
import {
  Crosshair,
  DollarSign,
  ExternalLink,
  Footprints,
  MapPin,
  Pencil,
  Ruler,
  Trash2,
  User as UserIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useExpansionSite } from "@/api/expansion/expansion.get";
import {
  useDeleteExpansionSite,
  useUpdateExpansionSite,
} from "@/api/expansion/expansion.mutations";
import type { ExpansionSiteDetail, ExpansionSiteStatus } from "@/api/expansion/expansion.types";
import { personName } from "@/components/pages/crm/crm-format";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DetailPanelSkeleton } from "@/components/ui/skeletons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBriloShortDate, formatDimensions, formatMoney } from "@/lib/format";
import { googleMapsUrl } from "@/lib/installer-portal";
import {
  FORMAT_OPTIONS,
  SITE_PRIORITY_LABELS,
  SITE_STATUSES,
  SITE_STATUS_META,
  streetViewUrl,
} from "../expansion-const";
import type { MappedBillboard } from "../expansion-analysis";
import { SiteStatusBadge } from "../expansion-badges";
import { ExpansionSiteAnalysis } from "./expansion-site-analysis";
import { ExpansionSiteComments } from "./expansion-site-comments";
import { ExpansionSiteDocuments } from "./expansion-site-documents";

const TAB_CONTENT_CLASS = "min-h-0 flex-1 data-[state=inactive]:hidden";

type Props = {
  siteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billboards: MappedBillboard[];
  periodMonths: number;
  periodLabel: string;
  onEdit: (site: ExpansionSiteDetail) => void;
  onLocate: (site: ExpansionSiteDetail) => void;
  onSelectBillboard: (billboard: MappedBillboard) => void;
};

export function ExpansionSiteDrawer({ siteId, open, onOpenChange, ...rest }: Props) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right" handleOnly>
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[640px]">
        {siteId ? (
          <DrawerBody key={siteId} siteId={siteId} onClose={() => onOpenChange(false)} {...rest} />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  siteId,
  onClose,
  billboards,
  periodMonths,
  periodLabel,
  onEdit,
  onLocate,
  onSelectBillboard,
}: Omit<Props, "siteId" | "open" | "onOpenChange"> & { siteId: string; onClose: () => void }) {
  const { data: site, isLoading, isError } = useExpansionSite(siteId);
  const updateSite = useUpdateExpansionSite();
  const deleteSite = useDeleteExpansionSite();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <DetailPanelSkeleton sections={3} />;

  if (isError || !site) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">No pudimos cargar esta ubicación.</p>
      </div>
    );
  }

  async function changeStatus(status: ExpansionSiteStatus) {
    try {
      await updateSite.mutateAsync({ id: siteId, status });
      toast.success(`Estado: ${SITE_STATUS_META[status].label}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado.");
    }
  }

  async function handleDelete() {
    try {
      await deleteSite.mutateAsync(siteId);
      toast.success("Ubicación eliminada.");
      setConfirmDelete(false);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la ubicación.");
    }
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <DrawerTitle className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm">{site.code}</span>
              <SiteStatusBadge status={site.status} />
            </DrawerTitle>
            <DrawerDescription className="truncate text-base font-medium text-foreground">
              {site.name}
            </DrawerDescription>
          </div>
          <PrimitiveButton variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </PrimitiveButton>
        </div>
      </DrawerHeader>

      <Tabs defaultValue="analisis" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="analisis">Análisis</TabsTrigger>
          <TabsTrigger value="detalle">Detalle</TabsTrigger>
          <TabsTrigger value="comentarios">Comentarios ({site.comments.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({site.documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="analisis" className={TAB_CONTENT_CLASS}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <ExpansionSiteAnalysis
                site={site}
                billboards={billboards}
                periodMonths={periodMonths}
                periodLabel={periodLabel}
                onSelectBillboard={onSelectBillboard}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="detalle" className={TAB_CONTENT_CLASS}>
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-5 p-4">
              <SiteDetail site={site} onStatusChange={changeStatus} pending={updateSite.isPending} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="comentarios" className={TAB_CONTENT_CLASS}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <ExpansionSiteComments siteId={site.id} comments={site.comments} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="documentos" className={TAB_CONTENT_CLASS}>
          <ScrollArea className="h-full">
            <div className="p-4">
              <ExpansionSiteDocuments siteId={site.id} documents={site.documents} />
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <DrawerFooter className="flex-row flex-wrap justify-between border-t">
        <Button
          variant="ghost"
          icon={Trash2}
          className="text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          Eliminar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" icon={Crosshair} onClick={() => onLocate(site)}>
            Ver en mapa
          </Button>
          <Button icon={Pencil} onClick={() => onEdit(site)}>
            Editar
          </Button>
        </div>
      </DrawerFooter>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Eliminar ${site.code}`}
        description="Se eliminará la ubicación junto con sus comentarios y documentos."
        pending={deleteSite.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}

function SiteDetail({
  site,
  onStatusChange,
  pending,
}: {
  site: ExpansionSiteDetail;
  onStatusChange: (status: ExpansionSiteStatus) => void;
  pending: boolean;
}) {
  const mapsUrl = googleMapsUrl(site.latitude, site.longitude, site.address ?? site.name);
  const format = FORMAT_OPTIONS.find((option) => option.value === site.formatCode)?.label;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Estado"
          value={site.status}
          disabled={pending}
          onValueChange={(value) => onStatusChange(value as ExpansionSiteStatus)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SITE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {SITE_STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Prioridad</p>
          <p className="flex h-9 items-center text-sm font-medium">
            {SITE_PRIORITY_LABELS[site.priority]}
          </p>
        </div>
      </div>

      {site.description ? (
        <div className="rounded-lg border bg-card p-3">
          <h4 className="text-xs font-semibold text-muted-foreground">Descripción</h4>
          <p className="whitespace-pre-wrap pt-1 text-sm">{site.description}</p>
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow
          icon={MapPin}
          label="Ubicación"
          value={
            [site.address, site.departmentName].filter(Boolean).join(", ") ||
            `${site.latitude.toFixed(5)}, ${site.longitude.toFixed(5)}`
          }
        />
        <InfoRow
          icon={Ruler}
          label="Formato y medidas"
          value={`${format ?? "Sin formato"} · ${formatDimensions(site.width, site.height)} m`}
        />
        <InfoRow
          icon={UserIcon}
          label="Creada por"
          value={`${site.createdBy ? personName(site.createdBy) : "-"} · ${formatBriloShortDate(site.createdAt)}`}
        />
        <InfoRow
          icon={DollarSign}
          label="Precio / costo estimado"
          value={`${formatMoney(site.estimatedMonthlyPrice)} / ${formatMoney(site.estimatedMonthlyCost)}`}
        />
      </dl>

      <div className="flex flex-wrap gap-2">
        {mapsUrl ? (
          <Button
            variant="outline"
            sizeVariant="sm"
            icon={ExternalLink}
            onClick={() => window.open(mapsUrl, "_blank", "noopener")}
          >
            Google Maps
          </Button>
        ) : null}
        <Button
          variant="outline"
          sizeVariant="sm"
          icon={Footprints}
          onClick={() => window.open(streetViewUrl(site.latitude, site.longitude), "_blank", "noopener")}
        >
          Street View
        </Button>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm">{value}</dd>
      </div>
    </div>
  );
}
