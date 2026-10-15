"use client";

import { toast } from "sonner";
import { useClient } from "@/api/clients/clients.get";
import { useUpdateClient } from "@/api/clients/clients.patch";
import type { Client, UpdateClientInput } from "@/api/clients/clients.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitleWithInfo,
} from "@/components/ui/card";
import { TextEditField } from "@/components/ui/edit-field";
import { formatLongDate } from "@/lib/format";
import { ClientTypeToggleField } from "./client-type-toggle-field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ClientInfoPanel({ clientId }: { clientId: string }) {
  const { data: client, isLoading, isError } = useClient(clientId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-36" />
      </div>
    );
  }
  if (isError || !client) {
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No se pudo cargar la información del cliente.
      </p>
    );
  }
  return <ClientInfoForm client={client} />;
}

function ClientInfoForm({ client }: { client: Client }) {
  const updateMutation = useUpdateClient();
  const isPending = updateMutation.isPending;

  const update = (input: UpdateClientInput) =>
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

  return (
    <div className="flex flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitleWithInfo info="Datos generales del cliente. Toca cualquier campo para editarlo en línea.">
            Información general
          </CardTitleWithInfo>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientTypeToggleField
            value={client.type}
            isPending={isPending}
            onChange={(type) => void update({ type }).catch(() => {})}
          />
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
            label="Teléfono"
            type="tel"
            initialValue={client.contact}
            emptyText="Sin teléfono registrado"
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

      <div className="grid grid-cols-1 gap-3 rounded-md border border-border/60 bg-muted/10 p-3 sm:grid-cols-2">
        <MetadataItem label="Registrado" value={formatLongDate(client.createdAt)} />
        <MetadataItem
          label="Última actualización"
          value={formatLongDate(client.updatedAt)}
        />
      </div>
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  );
}
