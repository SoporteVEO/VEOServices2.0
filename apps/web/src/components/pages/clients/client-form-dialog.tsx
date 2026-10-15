"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCreateClient } from "@/api/clients/clients.post";
import type { Client, ClientType } from "@/api/clients/clients.types";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  type: ClientType;
  name: string;
  company: string;
  email: string;
  billingEmail: string;
  contact: string;
}

const EMPTY_FORM: FormState = {
  type: "DIRECT",
  name: "",
  company: "",
  email: "",
  billingEmail: "",
  contact: "",
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
    const email = form.email.trim();
    const billingEmail = form.billingEmail.trim();

    if (!name) {
      toast.error(
        isAgency
          ? "Ingresa el nombre de la agencia."
          : "Ingresa el nombre del cliente.",
      );
      return;
    }
    if (!EMAIL_RE.test(email)) {
      toast.error("Ingresa un correo electrónico válido.");
      return;
    }
    if (billingEmail && !EMAIL_RE.test(billingEmail)) {
      toast.error("El correo de facturación no es válido.");
      return;
    }

    createMutation.mutate(
      {
        type: form.type,
        name,
        company: form.company.trim() || null,
        email,
        billingEmail: billingEmail || null,
        contact: form.contact.trim() || null,
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
            Registra un cliente directo o una agencia.
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={isAgency ? "Nombre de la agencia" : "Nombre"}
              required
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
            <Input
              label={isAgency ? "Razón social" : "Empresa"}
              value={form.company}
              onChange={(e) => setField("company", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Correo principal"
              required
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
            <Input
              label="Correo de facturación"
              type="email"
              placeholder="Usar correo principal"
              value={form.billingEmail}
              onChange={(e) => setField("billingEmail", e.target.value)}
            />
          </div>

          <Input
            label="Teléfono"
            type="tel"
            value={form.contact}
            onChange={(e) => setField("contact", e.target.value)}
          />
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
