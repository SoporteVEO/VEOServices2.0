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
import { BriloClientCombobox } from "@/components/pages/my-space/brilo-client-combobox";
import { TextEditField } from "@/components/ui/edit-field";
import { formatLongDate } from "@/lib/format";
import { ClientTypeToggleField } from "./client-type-toggle-field";

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
          <CardTitleWithInfo info="Para una agencia, usa el nombre de la empresa. Correos y teléfonos se gestionan como contactos del cliente.">
            Información general
          </CardTitleWithInfo>
        </CardHeader>
        <CardContent className="space-y-4">
          <ClientTypeToggleField
            value={client.type}
            isPending={isPending}
            onChange={(type) => void update({ type }).catch(() => {})}
          />
          <TextEditField
            label="Nombre"
            required
            initialValue={client.name}
            isPending={isPending}
            onSubmit={(v) => update({ name: v ?? "" })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitleWithInfo info="Al aceptar una cotización de este cliente, el cliente de Brilo se completa automáticamente.">
            Cliente en Brilo
          </CardTitleWithInfo>
        </CardHeader>
        <CardContent>
          <BriloClientCombobox
            label="Cliente Brilo (opcional)"
            required={false}
            value={client.briloClient ?? null}
            onChange={(briloClient) =>
              void update({ briloCliId: briloClient?.cliId ?? null }).catch(
                () => {},
              )
            }
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
