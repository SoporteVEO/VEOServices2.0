"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  CalendarClock,
  History,
  Mail,
  Monitor,
  Pencil,
  ScrollText,
  User as UserIcon,
  UserCheck,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useOffer } from "@/api/offers/offers.get";
import { useUpdateOffer } from "@/api/offers/offers.patch";
import type {
  BriloContractOption,
  OfferDetail,
  OfferStatus,
} from "@/api/offers/offers.types";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { Label } from "@/components/primitives/ui/label";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Separator } from "@/components/primitives/ui/separator";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBriloShortDate, formatMoney } from "@/lib/format";
import { GenerateOfferModal } from "./quotation/generate-offer-modal";
import { BriloContractCombobox } from "./brilo-contract-combobox";
import { MyOfferDetailSkeleton } from "./my-offer-detail-skeleton";
import { MyOfferDownloadButton } from "./my-offer-download-button";
import { MyOfferHistory } from "./my-offer-history";
import { MY_OFFER_ITEMS_COLUMNS } from "./my-offer-items-columns";
import { MyOfferStatusBadge } from "./my-offer-status-badge";
import { MyOfferTotalsSummary } from "./my-offer-totals-summary";
import { useMySpaceViewAs } from "./my-space-view-as-context";

const STATUS_OPTIONS: { value: OfferStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "DECLINED", label: "Rechazada" },
  { value: "ACCEPTED", label: "Aceptada" },
];

type MyOfferDetailDrawerProps = {
  offerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MyOfferDetailDrawer({
  offerId,
  open,
  onOpenChange,
}: MyOfferDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent className="flex flex-col data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[92vw] data-[vaul-drawer-direction=right]:sm:max-w-[1080px]">
        {offerId ? (
          <MyOfferDetailDrawerBody
            key={offerId}
            offerId={offerId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function MyOfferDetailDrawerBody({
  offerId,
  onClose,
}: {
  offerId: string;
  onClose: () => void;
}) {
  const { viewAsUserId } = useMySpaceViewAs();
  const { data: offer, isLoading, isError } = useOffer(offerId, {
    viewAsUserId,
  });

  if (isLoading) {
    return <MyOfferDetailSkeleton />;
  }

  if (isError || !offer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la cotización.
        </p>
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <MyOfferDetailContent
      offer={offer}
      onClose={onClose}
      readOnly={Boolean(viewAsUserId)}
    />
  );
}

function MyOfferDetailContent({
  offer,
  onClose,
  readOnly,
}: {
  offer: OfferDetail;
  onClose: () => void;
  readOnly: boolean;
}) {
  const updateMutation = useUpdateOffer();
  const [status, setStatus] = useState<OfferStatus>(offer.status);
  const [editOpen, setEditOpen] = useState(false);
  const [linkedContract, setLinkedContract] = useState<BriloContractOption | null>(
    offer.linkedBriloContract,
  );

  const canEdit = offer.canEdit && !readOnly;

  const isDirty = useMemo(() => {
    if (status !== offer.status) return true;
    const currentMconId = linkedContract?.mconId ?? null;
    return currentMconId !== offer.briloMconId;
  }, [status, linkedContract, offer]);

  function handleStatusChange(next: OfferStatus) {
    setStatus(next);
    if (next !== "ACCEPTED") {
      setLinkedContract(null);
    }
  }

  function handleSave() {
    if (status === "ACCEPTED" && !linkedContract) {
      toast.error(
        "Selecciona el contrato de Brilo vinculado para una cotización aceptada.",
      );
      return;
    }

    updateMutation.mutate(
      {
        id: offer.id,
        input: {
          status,
          briloMconId:
            status === "ACCEPTED" ? linkedContract?.mconId : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Cotización actualizada.");
          onClose();
        },
        onError: (err) =>
          toast.error(err.message || "No se pudo actualizar la cotización."),
      },
    );
  }

  return (
    <>
      <DrawerHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <DrawerTitle className="truncate text-base font-semibold">
              {offer.offerNumber}
            </DrawerTitle>
            <DrawerDescription className="flex items-center gap-1.5 text-xs">
              <CalendarClock className="size-3 shrink-0" />
              <span className="truncate">
                Creada el {formatBriloShortDate(offer.createdAt)}
              </span>
            </DrawerDescription>
            <div className="pt-1.5">
              <MyOfferStatusBadge status={offer.status} />
            </div>
          </div>
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Pencil}
              onClick={() => setEditOpen(true)}
            >
              Editar
            </Button>
          ) : null}
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
        <div className="flex min-w-0 flex-col gap-6 p-4">
          <MetricsRow offer={offer} />

          <Separator />

          <Section
            icon={UserIcon}
            title="Cliente"
            description="Datos del contacto al que se le envió la cotización."
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <InfoCard label="Nombre" value={offer.customerName} />
              <InfoCard label="Empresa" value={offer.customerCompany} />
              <InfoCard
                icon={Mail}
                label="Correo cliente"
                value={offer.customerEmail}
              />
              <InfoCard
                icon={Mail}
                label="Correo facturación"
                value={offer.customerBillingEmail}
              />
              <InfoCard label="Contacto" value={offer.customerContact} />
              <InfoCard label="Asesor" value={offer.advisorFullName} />
            </div>
            {offer.specialConditions ? (
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Condiciones especiales
                </p>
                <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                  {offer.specialConditions}
                </p>
              </div>
            ) : null}
          </Section>

          <Separator />

          <Section
            icon={ScrollText}
            title="Totales"
            description="Desglose de subtotales, IVA y totales por concepto."
          >
            <MyOfferTotalsSummary offer={offer} />
          </Section>

          <Separator />

          <Section
            icon={Monitor}
            title="Vallas"
            description={
              offer.items.length === 1
                ? "1 valla incluida en la cotización."
                : `${offer.items.length} vallas incluidas en la cotización.`
            }
            badge={
              <Badge variant="secondary" className="gap-1">
                <Monitor className="size-3" aria-hidden />
                {offer.items.length}
              </Badge>
            }
          >
            <DataTable
              columns={MY_OFFER_ITEMS_COLUMNS}
              data={offer.items}
              rowSize="sm"
              emptyMessage="Esta cotización no tiene vallas."
            />
          </Section>

          <Separator />

          <Section
            icon={Activity}
            title="Seguimiento"
            description={
              readOnly
                ? "Estás revisando esta cotización en modo lectura."
                : "Actualiza el estado y vincula el contrato de Brilo correspondiente."
            }
          >
            <div className="flex flex-col gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="offer-status">Estado</Label>
                <Select
                  value={status}
                  onValueChange={(v) => handleStatusChange(v as OfferStatus)}
                  disabled={readOnly}
                >
                  <SelectTrigger id="offer-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {status === "ACCEPTED" ? (
                <BriloContractCombobox
                  label="Contrato Brilo vinculado"
                  value={linkedContract?.mconId ?? null}
                  onChange={readOnly ? () => undefined : setLinkedContract}
                  defaultSelectedContract={linkedContract}
                  required
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  El contrato de Brilo solo es necesario cuando la cotización
                  está aceptada.
                </p>
              )}
            </div>
          </Section>

          <Separator />

          <Section
            icon={History}
            title="Historial"
            description="Registro de cada cambio, quién lo hizo y cuándo."
          >
            <MyOfferHistory offer={offer} />
          </Section>
        </div>
      </ScrollArea>

      <DrawerFooter className="border-t">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <MyOfferDownloadButton offer={offer} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {readOnly ? null : (
              <Button
                type="button"
                disabled={!isDirty || updateMutation.isPending}
                onClick={handleSave}
              >
                {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
              </Button>
            )}
          </div>
        </div>
      </DrawerFooter>

      {editOpen ? (
        <GenerateOfferModal
          open={editOpen}
          onOpenChange={setEditOpen}
          offer={offer}
        />
      ) : null}
    </>
  );
}

function MetricsRow({ offer }: { offer: OfferDetail }) {
  const grandTotal = offer.totalRental + offer.totalImpression;
  const advisor = offer.advisorFullName ?? "—";

  const items = [
    {
      icon: Wallet,
      label: "Total general",
      value: formatMoney(grandTotal),
    },
    {
      icon: Monitor,
      label: "Vallas",
      value: offer.items.length.toString(),
    },
    {
      icon: CalendarClock,
      label: "Vigencia",
      value: formatBriloShortDate(offer.validUntil),
    },
    {
      icon: UserCheck,
      label: "Asesor",
      value: advisor,
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 flex-col gap-1 rounded-md border bg-accent/10 p-2.5"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <item.icon className="size-3" />
            <span className="truncate">{item.label}</span>
          </div>
          <span className="truncate text-sm font-semibold tabular-nums">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-3.5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="text-sm font-semibold leading-none">{title}</h3>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {children ? (
        <div className="space-y-3 pl-0 sm:pl-8">{children}</div>
      ) : null}
    </section>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-md border bg-accent/10 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {Icon ? <Icon className="size-3 shrink-0" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <span
        className="truncate text-sm font-medium text-foreground"
        title={value ?? undefined}
      >
        {value && value.trim().length > 0 ? value : "—"}
      </span>
    </div>
  );
}
