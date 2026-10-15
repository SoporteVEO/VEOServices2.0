"use client";

import { useState } from "react";
import { Building2, Mail, Phone, Plus, X } from "lucide-react";
import { useCrmClientSummary, useCrmContacts } from "@/api/crm/crm.get";
import type { CrmClientSummary } from "@/api/crm/crm.types";
import { getClientInitials } from "@/components/pages/clients/client-initials";
import { ClientTypeBadge } from "@/components/pages/clients/client-type-badge";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { Badge } from "@/components/primitives/ui/badge";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CrmActivityComposer } from "../activity/crm-activity-composer";
import { CrmActivityTimeline } from "../activity/crm-activity-timeline";
import { OFFER_STATUS_LABELS, OFFER_STATUS_STYLES } from "../crm-const";
import { personName, timeAgo } from "../crm-format";
import { CrmContactDrawer } from "../contacts/crm-contact-drawer";
import { CrmContactFormDialog } from "../contacts/crm-contact-form-dialog";
import { EmptyList, ListSkeleton } from "../dashboard/crm-dashboard-lists";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmMessageThread } from "../messages/crm-message-thread";
import { CrmDealFormDialog } from "../pipeline/crm-deal-form-dialog";
import { CrmDealList } from "../shared/crm-deal-list";

interface Props {
  clientId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CrmClientDrawer({ clientId, onOpenChange }: Props) {
  return (
    <Drawer open={clientId !== null} onOpenChange={onOpenChange} direction="right" handleOnly>
      <DrawerContent
        size="2xl"
        className="flex max-h-dvh data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[720px] data-[vaul-drawer-direction=right]:lg:max-w-[860px]"
      >
        {clientId ? (
          <ClientDrawerBody
            key={clientId}
            clientId={clientId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function ClientDrawerBody({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const { data: summary, isLoading } = useCrmClientSummary(clientId);

  if (isLoading || !summary) {
    return (
      <>
        <DrawerHeader className="shrink-0 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="size-10" />
              <div className="flex-1 space-y-1.5">
                <DrawerTitle className="sr-only">Cliente</DrawerTitle>
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-56" />
              </div>
            </div>
            <CloseButton onClose={onClose} />
          </div>
        </DrawerHeader>
        <div className="grid grid-cols-4 gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </>
    );
  }
  return <ClientDrawerContent summary={summary} onClose={onClose} />;
}

function ClientDrawerContent({
  summary,
  onClose,
}: {
  summary: CrmClientSummary;
  onClose: () => void;
}) {
  const { client, stats, offers } = summary;
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [dealOpen, setDealOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const context = { clientId: client.id };
  const clientRef = { id: client.id, name: client.name, company: client.company };

  return (
    <>
      <DrawerHeader className="shrink-0 gap-3 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="text-sm font-medium">
                {getClientInitials(client)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <DrawerTitle className="truncate text-base font-semibold">
                  {client.name}
                </DrawerTitle>
                <ClientTypeBadge type={client.type} />
              </div>
              <DrawerDescription className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                {client.company ? (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3" />
                    {client.company}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  {client.email}
                </span>
                {client.contact ? (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {client.contact}
                  </span>
                ) : null}
              </DrawerDescription>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button sizeVariant="sm" icon={Plus} onClick={() => setDealOpen(true)}>
              Negocio
            </Button>
            <CloseButton onClose={onClose} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Abiertos" value={formatMoney(stats.openValue)} hint={`${stats.openDeals} negocios`} />
          <Stat label="Ganado" value={formatMoney(stats.wonValue)} hint={`${stats.wonDeals} ganados · ${stats.lostDeals} perdidos`} />
          <Stat
            label="Cotizaciones"
            value={String(stats.offersCount)}
            hint={`${stats.offersAccepted} aceptadas · ${formatMoney(stats.offersTotal)}`}
          />
          <Stat
            label="Última actividad"
            value={stats.lastActivityAt ? timeAgo(stats.lastActivityAt) : "Sin actividad"}
          />
        </div>
      </DrawerHeader>

      <Tabs defaultValue="negocios" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="negocios">Negocios</TabsTrigger>
          <TabsTrigger value="contactos">Contactos</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
          <TabsTrigger value="cotizaciones">Cotizaciones</TabsTrigger>
        </TabsList>
        <Panel value="negocios">
          <div className="p-4">
            <CrmDealList
              query={context}
              onOpenDeal={setSelectedDealId}
              emptyMessage="Este cliente aún no tiene negocios."
            />
          </div>
        </Panel>
        <Panel value="contactos">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex justify-end">
              <Button sizeVariant="sm" icon={Plus} onClick={() => setContactOpen(true)}>
                Nuevo contacto
              </Button>
            </div>
            <ClientContacts clientId={client.id} onOpen={setSelectedContactId} />
          </div>
        </Panel>
        <Panel value="actividad">
          <div className="flex flex-col gap-5 p-4">
            <CrmActivityComposer context={context} />
            <CrmActivityTimeline context={context} showDeal />
          </div>
        </Panel>
        <Panel value="mensajes">
          <div className="p-4">
            <CrmMessageThread
              context={context}
              recipient={{ email: client.email, whatsapp: client.contact }}
            />
          </div>
        </Panel>
        <Panel value="cotizaciones">
          <div className="p-4">
            {offers.length === 0 ? (
              <EmptyList message="Este cliente no tiene cotizaciones." />
            ) : (
              <ul className="flex flex-col divide-y border border-border">
                {offers.map((offer) => (
                  <li key={offer.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{offer.offerNumber}</span>
                        <Badge variant="outline" className={cn("h-5", OFFER_STATUS_STYLES[offer.status])}>
                          {OFFER_STATUS_LABELS[offer.status]}
                        </Badge>
                        {offer.dealId ? (
                          <button
                            type="button"
                            className="cursor-pointer text-xs text-info hover:underline"
                            onClick={() => setSelectedDealId(offer.dealId)}
                          >
                            Ver negocio
                          </button>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(offer.createdAt)} · {offer.createdByName}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMoney(offer.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </Tabs>

      <CrmDealFormDialog
        open={dealOpen}
        onOpenChange={setDealOpen}
        defaultClient={clientRef}
        onSaved={(deal) => setSelectedDealId(deal.id)}
      />
      <CrmContactFormDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        defaultClient={clientRef}
      />
      <CrmDealDrawer
        dealId={selectedDealId}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
      />
      <CrmContactDrawer
        contactId={selectedContactId}
        onOpenChange={(open) => {
          if (!open) setSelectedContactId(null);
        }}
      />
    </>
  );
}

function ClientContacts({
  clientId,
  onOpen,
}: {
  clientId: string;
  onOpen: (contactId: string) => void;
}) {
  const { data, isLoading } = useCrmContacts({ clientId, pageSize: 100 });
  const contacts = data?.data ?? [];

  if (isLoading) return <ListSkeleton rows={3} />;
  if (contacts.length === 0) return <EmptyList message="Sin contactos registrados." />;

  return (
    <ul className="flex flex-col divide-y border border-border">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <button
            type="button"
            onClick={() => onOpen(contact.id)}
            className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 truncate text-sm font-medium">
                {personName(contact)}
                {contact.isPrimary ? <Badge variant="secondary">Principal</Badge> : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {[contact.jobTitle, contact.email, contact.phone].filter(Boolean).join(" · ") || "—"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {contact.openDeals} abiertos
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border border-border bg-background p-2.5">
      <span className="eyebrow truncate text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-semibold tabular-nums">{value}</span>
      {hint ? <span className="truncate text-[11px] text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

function Panel({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsContent value={value} className="min-h-0 flex-1 data-[state=inactive]:hidden">
      <ScrollArea className="h-full">{children}</ScrollArea>
    </TabsContent>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <PrimitiveButton variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar">
      <X />
    </PrimitiveButton>
  );
}
