"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateClient } from "@/api/clients/clients.post";
import type { Client, ClientType } from "@/api/clients/clients.types";
import type { BriloClientOption } from "@/api/offers/offers.types";
import { BriloClientCombobox } from "@/components/pages/my-space/brilo-client-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLIENT_TYPE_DESCRIPTIONS,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_ORDER,
} from "./const";

interface FormState {
  type: ClientType;
  name: string;
  briloClient: BriloClientOption | null;
}

const EMPTY_FORM: FormState = {
  type: "DIRECT",
  name: "",
  briloClient: null,
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (client: Client) => void;
};

export function ClientFormDialog({ open, onOpenChange, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [wasOpen, setWasOpen] = useState(open);
  const createMutation = useCreateClient();

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setForm(EMPTY_FORM);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isAgency = form.type === "AGENCY";

  function handleSubmit() {
    const name = form.name.trim();

    if (!name) {
      toast.error(
        isAgency
          ? "Ingresa el nombre de la agencia."
          : "Ingresa el nombre del cliente.",
      );
      return;
    }

    createMutation.mutate(
      {
        type: form.type,
        name,
        briloCliId: form.briloClient?.cliId ?? null,
      },
      {
        onSuccess: (created) => {
          toast.success(
            `${CLIENT_TYPE_LABELS[created.type]} ${created.name} registrado.`,
          );
          onCreated?.(created);
          onOpenChange(false);
        },
        onError: (error) =>
          toast.error(error.message || "No se pudo registrar el cliente."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Registra un cliente directo o una agencia. Agrega sus correos y
            teléfonos como contactos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1.5">
            <Select
              label="Tipo de cliente"
              required
              value={form.type}
              onValueChange={(value) => setField("type", value as ClientType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_TYPE_ORDER.map((type) => (
                  <SelectItem key={type} value={type}>
                    {CLIENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {CLIENT_TYPE_DESCRIPTIONS[form.type]}
            </p>
          </div>

          <Input
            label={isAgency ? "Nombre de la agencia" : "Nombre"}
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <BriloClientCombobox
              label="Cliente Brilo (opcional)"
              required={false}
              value={form.briloClient}
              onChange={(client) => setField("briloClient", client)}
            />
            <p className="text-xs text-muted-foreground">
              Al aceptar una cotización de este cliente, el cliente de Brilo se
              completará automáticamente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
