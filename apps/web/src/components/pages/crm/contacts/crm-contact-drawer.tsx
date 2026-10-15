"use client";

import { useState } from "react";
import { Building2, Mail, Pencil, Phone, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useCrmContact } from "@/api/crm/crm.get";
import { useDeleteCrmContact } from "@/api/crm/crm.mutations";
import type { CrmContact } from "@/api/crm/crm.types";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrmActivityComposer } from "../activity/crm-activity-composer";
import { CrmActivityTimeline } from "../activity/crm-activity-timeline";
import { clientLabel, errorMessage, personInitials, personName } from "../crm-format";
import { CrmDealDrawer } from "../deal/crm-deal-drawer";
import { CrmMessageThread } from "../messages/crm-message-thread";
import { CrmDealList } from "../shared/crm-deal-list";
import { CrmTaskFormDialog } from "../tasks/crm-task-form-dialog";
import { CrmTaskList } from "../tasks/crm-task-list";
import { CrmContactFormDialog } from "./crm-contact-form-dialog";

interface Props {
  contactId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CrmContactDrawer({ contactId, onOpenChange }: Props) {
  return (
    <Drawer open={contactId !== null} onOpenChange={onOpenChange} direction="right" handleOnly>
      <DrawerContent
        size="xl"
        className="flex max-h-dvh data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[640px] data-[vaul-drawer-direction=right]:lg:max-w-[760px]"
      >
        {contactId ? (
          <ContactDrawerBody
            key={contactId}
            contactId={contactId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function ContactDrawerBody({
  contactId,
  onClose,
}: {
  contactId: string;
  onClose: () => void;
}) {
  const { data: contact, isLoading } = useCrmContact(contactId);

  if (isLoading || !contact) {
    return (
      <DrawerHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <DrawerTitle className="sr-only">Contacto</DrawerTitle>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <CloseButton onClose={onClose} />
        </div>
      </DrawerHeader>
    );
  }
  return <ContactDrawerContent contact={contact} onClose={onClose} />;
}

function ContactDrawerContent({
  contact,
  onClose,
}: {
  contact: CrmContact;
  onClose: () => void;
}) {
  const deleteContact = useDeleteCrmContact();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const context = { contactId: contact.id };
  const client = clientLabel(contact.client);

  function handleDelete() {
    deleteContact.mutate(
      { id: contact.id },
      {
        onSuccess: () => {
          toast.success("Contacto eliminado");
          setDeleteOpen(false);
          onClose();
        },
        onError: (error) =>
          toast.error(errorMessage(error, "No se pudo eliminar el contacto.")),
      },
    );
  }

  return (
    <>
      <DrawerHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="text-sm font-medium">
                {personInitials(contact)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-0.5">
              <DrawerTitle className="truncate text-base font-semibold">
                {personName(contact)}
              </DrawerTitle>
              <DrawerDescription className="truncate text-xs">
                {contact.jobTitle ?? "Sin cargo"}
              </DrawerDescription>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {client ? (
                  <span className="flex items-center gap-1">
                    <Building2 className="size-3" />
                    {client}
                  </span>
                ) : null}
                {contact.email ? (
                  <span className="flex items-center gap-1">
                    <Mail className="size-3" />
                    {contact.email}
                  </span>
                ) : null}
                {contact.phone ? (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {contact.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <PrimitiveButton
              variant="ghost"
              size="icon-sm"
              aria-label="Editar contacto"
              onClick={() => setEditOpen(true)}
            >
              <Pencil />
            </PrimitiveButton>
            <PrimitiveButton
              variant="ghost"
              size="icon-sm"
              aria-label="Eliminar contacto"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
            </PrimitiveButton>
            <CloseButton onClose={onClose} />
          </div>
        </div>
        {contact.notes ? (
          <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
            {contact.notes}
          </p>
        ) : null}
      </DrawerHeader>

      <Tabs defaultValue="actividad" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TabsList className="mx-4 mt-3 self-start">
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
          <TabsTrigger value="negocios">Negocios</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
        </TabsList>
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
              recipient={{
                email: contact.email,
                whatsapp: contact.whatsapp ?? contact.phone,
              }}
            />
          </div>
        </Panel>
        <Panel value="negocios">
          <div className="p-4">
            <CrmDealList
              query={{ contactId: contact.id }}
              onOpenDeal={setSelectedDealId}
              emptyMessage="Este contacto no tiene negocios."
            />
          </div>
        </Panel>
        <Panel value="tareas">
          <div className="flex flex-col gap-3 p-4">
            <div className="flex justify-end">
              <Button sizeVariant="sm" icon={Plus} onClick={() => setTaskOpen(true)}>
                Nueva tarea
              </Button>
            </div>
            <CrmTaskList
              query={{ ...context, assigneeId: "all", bucket: "open" }}
              emptyMessage="No hay tareas pendientes."
              showAssignee
              onOpenDeal={setSelectedDealId}
            />
          </div>
        </Panel>
      </Tabs>

      <CrmContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
      <CrmTaskFormDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        context={{ contactId: contact.id, clientId: contact.client?.id }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar contacto"
        description={`Se eliminará a ${personName(contact)}. Sus negocios se conservarán sin contacto.`}
        pending={deleteContact.isPending}
        onConfirm={handleDelete}
      />
      <CrmDealDrawer
        dealId={selectedDealId}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
      />
    </>
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
