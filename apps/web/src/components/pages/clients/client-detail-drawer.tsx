"use client";

import { useMemo } from "react";
import { Building2, Mail, X } from "lucide-react";
import { toast } from "sonner";

import { useClient } from "@/api/clients/clients.get";
import { useUpdateClient } from "@/api/clients/clients.patch";
import type { Client, UpdateClientInput } from "@/api/clients/clients.types";
import { Avatar, AvatarFallback } from "@/components/primitives/ui/avatar";
import { Button as PrimitiveButton } from "@/components/primitives/ui/button";
import { ScrollArea } from "@/components/primitives/ui/scroll-area";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TextEditField } from "@/components/ui/edit-field";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getInitials(client: Client): string {
  const source = client.name?.trim() || client.email;
  if (!source) return "?";
  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]);
  return parts.join("").slice(0, 2).toUpperCase() || source[0]!.toUpperCase();
}

interface ClientDetailDrawerProps {
  clientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDetailDrawer({
  clientId,
  open,
  onOpenChange,
}: ClientDetailDrawerProps) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      handleOnly
    >
      <DrawerContent
        size="xl"
        className="flex max-h-dvh data-[vaul-drawer-direction=right]:h-screen data-[vaul-drawer-direction=right]:w-[96vw] data-[vaul-drawer-direction=right]:sm:max-w-[640px] data-[vaul-drawer-direction=right]:lg:max-w-[760px]"
      >
        {clientId ? (
          <ClientDetailDrawerBody
            key={clientId}
            clientId={clientId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

function ClientDetailDrawerBody({
  clientId,
  onClose,
}: {
  clientId: string;
  onClose: () => void;
}) {
  const { data: client, isLoading, isError } = useClient(clientId);

  if (isLoading) {
    return <ClientDetailSkeleton onClose={onClose} />;
  }

  if (isError || !client) {
    return (
      <>
        <DrawerHeader className="shrink-0 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="text-base font-semibold">
                Cliente
              </DrawerTitle>
              <DrawerDescription className="text-xs">
                No se pudo cargar la información del cliente.
              </DrawerDescription>
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
      </>
    );
  }

  return <ClientDetailContent client={client} onClose={onClose} />;
}

function ClientDetailContent({
  client,
  onClose,
}: {
  client: Client;
  onClose: () => void;
}) {
  const updateMutation = useUpdateClient();
  const isPending = updateMutation.isPending;
  const initials = getInitials(client);

  const update = useMemo(() => {
    return (input: UpdateClientInput) =>
      new Promise<void>((resolve, reject) => {
        updateMutation.mutate(
          { id: client.id, input },
          {
            onSuccess: () => {
              toast.success("Cliente actualizado");
              resolve();
            },
            onError: (err) => {
              toast.error(err.message || "No se pudo actualizar el cliente");
              reject(err);
            },
          },
        );
      });
  }, [updateMutation, client.id]);

  return (
    <>
      <DrawerHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <DrawerTitle className="truncate text-base font-semibold">
                {client.name}
              </DrawerTitle>
              <DrawerDescription className="flex items-center gap-1.5 text-xs">
                <Mail className="size-3 shrink-0" aria-hidden />
                <span className="truncate">{client.email}</span>
              </DrawerDescription>
              {client.company ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3 shrink-0" aria-hidden />
                  <span className="truncate">{client.company}</span>
                </p>
              ) : null}
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
        <div className="flex flex-col gap-4 p-4">
          <Card>
            <CardHeader>
              <CardTitleWithInfo info="Datos generales del cliente. Toca cualquier campo para editarlo en línea.">
                Información general
              </CardTitleWithInfo>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextEditField
                  label="Nombre"
                  required
                  initialValue={client.name}
                  isPending={isPending}
                  onSubmit={(v) => update({ name: v ?? "" })}
                />
                <TextEditField
                  label="Empresa"
                  initialValue={client.company}
                  emptyText="Sin empresa"
                  isPending={isPending}
                  onSubmit={(v) => update({ company: v })}
                />
              </div>
              <TextEditField
                label="Persona de contacto"
                initialValue={client.contact}
                emptyText="Sin contacto registrado"
                isPending={isPending}
                onSubmit={(v) => update({ contact: v })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitleWithInfo info="Correos asociados al cliente. El correo principal es la clave única en el sistema.">
                Correos electrónicos
              </CardTitleWithInfo>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextEditField
                label="Correo principal"
                required
                type="email"
                initialValue={client.email}
                isPending={isPending}
                validate={(v) =>
                  EMAIL_RE.test(v) ? null : "Correo electrónico no válido"
                }
                onSubmit={(v) => update({ email: v ?? "" })}
              />
              <TextEditField
                label="Correo de facturación"
                type="email"
                initialValue={client.billingEmail}
                emptyText="Usar correo principal"
                isPending={isPending}
                validate={(v) =>
                  v.length === 0 || EMAIL_RE.test(v)
                    ? null
                    : "Correo electrónico no válido"
                }
                onSubmit={(v) => update({ billingEmail: v })}
              />
            </CardContent>
          </Card>

          <ClientMetadata client={client} />
        </div>
      </ScrollArea>
    </>
  );
}

function ClientMetadata({ client }: { client: Client }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-md border border-border/60 bg-muted/10 p-3 sm:grid-cols-2">
      <MetadataItem
        label="Registrado"
        value={formatLongDate(client.createdAt)}
      />
      <MetadataItem
        label="Última actualización"
        value={formatLongDate(client.updatedAt)}
      />
    </div>
  );
}

function MetadataItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}

function ClientDetailSkeleton({ onClose }: { onClose: () => void }) {
  return (
    <>
      <DrawerHeader className="shrink-0 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-36" />
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
        <div className="flex flex-col gap-4 p-4">
          <SkeletonSection rows={2} fieldsPerRow={2} />
          <SkeletonSection rows={2} fieldsPerRow={1} />
          <SkeletonSection rows={1} fieldsPerRow={2} />
        </div>
      </ScrollArea>
    </>
  );
}

function SkeletonSection({
  rows,
  fieldsPerRow,
}: {
  rows: number;
  fieldsPerRow: number;
}) {
  const gridCols =
    fieldsPerRow === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={`row-${rowIdx}`} className={cn("grid gap-4", gridCols)}>
            {Array.from({ length: fieldsPerRow }).map((_, fieldIdx) => (
              <div
                key={`field-${rowIdx}-${fieldIdx}`}
                className="flex flex-col gap-1.5"
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
