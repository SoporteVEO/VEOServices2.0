"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Client } from "@/api/clients/clients.types";
import {
  useCreateCrmContact,
  useUpdateCrmContact,
} from "@/api/crm/crm.mutations";
import type { CrmContact } from "@/api/crm/crm.types";
import { ClientCombobox } from "@/components/pages/static-billboards/quotation/client-combobox";
import { Label } from "@/components/primitives/ui/label";
import { Switch } from "@/components/primitives/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "../crm-format";

type ClientRef = Pick<Client, "id" | "name" | "company">;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: CrmContact | null;
  defaultClient?: ClientRef | null;
  onSaved?: (contact: CrmContact) => void;
};

interface FormState {
  client: ClientRef | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  jobTitle: string;
  notes: string;
  isPrimary: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toForm(contact: CrmContact | null | undefined, client: ClientRef | null): FormState {
  return {
    client: contact?.client ?? client,
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    whatsapp: contact?.whatsapp ?? "",
    jobTitle: contact?.jobTitle ?? "",
    notes: contact?.notes ?? "",
    isPrimary: contact?.isPrimary ?? false,
  };
}

function clientStub(client: ClientRef): Client {
  return {
    ...client,
    type: "DIRECT",
    email: "",
    billingEmail: null,
    contact: null,
    briloCliId: null,
    createdAt: "",
    updatedAt: "",
  };
}

export function CrmContactFormDialog({
  open,
  onOpenChange,
  contact,
  defaultClient = null,
  onSaved,
}: Props) {
  const isEdit = !!contact;
  const [form, setForm] = useState<FormState>(() => toForm(contact, defaultClient));
  const [seededKey, setSeededKey] = useState<string | null>(null);

  const createMutation = useCreateCrmContact();
  const updateMutation = useUpdateCrmContact();
  const isBusy = createMutation.isPending || updateMutation.isPending;

  const seedKey = open ? (contact?.id ?? `new:${defaultClient?.id ?? ""}`) : null;
  if (seedKey !== seededKey) {
    setSeededKey(seedKey);
    setForm(toForm(contact, defaultClient));
  }

  function patch(next: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function handleSubmit() {
    if (!form.firstName.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    const email = form.email.trim();
    if (email && !EMAIL_RE.test(email)) {
      toast.error("Correo electrónico no válido.");
      return;
    }

    const payload = {
      clientId: form.client?.id ?? null,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || null,
      email: email || null,
      phone: form.phone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      jobTitle: form.jobTitle.trim() || null,
      notes: form.notes.trim() || null,
      isPrimary: form.isPrimary,
    };
    const callbacks = {
      onSuccess: (saved: CrmContact) => {
        toast.success(isEdit ? "Contacto actualizado" : "Contacto creado");
        onSaved?.(saved);
        onOpenChange(false);
      },
      onError: (error: Error) =>
        toast.error(errorMessage(error, "No se pudo guardar el contacto.")),
    };

    if (isEdit && contact) {
      updateMutation.mutate({ id: contact.id, ...payload }, callbacks);
    } else {
      createMutation.mutate(payload, callbacks);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
          <DialogDescription>
            Personas con las que te comunicas dentro de cada cliente.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4">
          <ClientCombobox
            key={seededKey ?? "closed"}
            label="Cliente"
            value={form.client?.id ?? null}
            defaultSelectedClient={form.client ? clientStub(form.client) : null}
            onChange={(client) =>
              patch({
                client: client
                  ? { id: client.id, name: client.name, company: client.company }
                  : null,
              })
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              required
              value={form.firstName}
              onChange={(e) => patch({ firstName: e.target.value })}
            />
            <Input
              label="Apellido"
              value={form.lastName}
              onChange={(e) => patch({ lastName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Cargo"
              placeholder="Gerente de Marketing"
              value={form.jobTitle}
              onChange={(e) => patch({ jobTitle: e.target.value })}
            />
            <Input
              label="Correo"
              type="email"
              value={form.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Teléfono"
              type="tel"
              value={form.phone}
              onChange={(e) => patch({ phone: e.target.value })}
            />
            <Input
              label="WhatsApp"
              type="tel"
              placeholder="Usa el teléfono si se deja vacío"
              value={form.whatsapp}
              onChange={(e) => patch({ whatsapp: e.target.value })}
            />
          </div>
          <Textarea
            label="Notas"
            rows={3}
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
          {form.client ? (
            <div className="flex items-center justify-between gap-3 border border-border p-3">
              <div>
                <Label htmlFor="crm-contact-primary" className="text-sm">
                  Contacto principal
                </Label>
                <p className="text-xs text-muted-foreground">
                  Se usa por defecto al crear negocios para este cliente.
                </p>
              </div>
              <Switch
                id="crm-contact-primary"
                checked={form.isPrimary}
                onCheckedChange={(isPrimary) => patch({ isPrimary })}
              />
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={isBusy}>
            {isEdit ? "Guardar cambios" : "Crear contacto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
