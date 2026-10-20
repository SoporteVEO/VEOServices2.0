"use client";

import { Info } from "lucide-react";
import type {
  BriloAcceptContext,
  BriloClientOption,
} from "@/api/offers/offers.types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/primitives/ui/alert";
import { BriloClientCombobox } from "./brilo-client-combobox";
import { BriloExecutiveCombobox } from "./brilo-executive-combobox";

type AcceptOfferBriloSectionProps = {
  context: BriloAcceptContext;
  client: BriloClientOption | null;
  onClientChange: (client: BriloClientOption | null) => void;
  executiveId: number | null;
  onExecutiveChange: (ejecId: number | null) => void;
};

function clientHint(context: BriloAcceptContext): string {
  if (context.linkedClient) {
    return "Cliente de Brilo vinculado al cliente de la cotización.";
  }
  const email = context.customerEmail;
  if (!email) {
    return "La cotización no tiene correo de cliente. Selecciona el cliente de Brilo.";
  }
  if (context.clientMatches.length === 0) {
    return `No encontramos un cliente en Brilo con el correo ${email}. Selecciónalo manualmente.`;
  }
  if (context.clientMatches.length > 1) {
    return `Varios clientes de Brilo usan el correo ${email}. Selecciona el correcto.`;
  }
  return `Cliente encontrado en Brilo por el correo ${email}.`;
}

function executiveHint(context: BriloAcceptContext): string {
  const advisor = context.advisorFullName ?? "el asesor";
  if (context.executiveMatchIds.length === 1) {
    return `Ejecutivo asignado según el nombre de ${advisor}.`;
  }
  if (context.executiveMatchIds.length > 1) {
    return `Varios ejecutivos coinciden con ${advisor}. Selecciona el correcto.`;
  }
  return `No encontramos un ejecutivo de Brilo para ${advisor}. Selecciónalo manualmente.`;
}

export function AcceptOfferBriloSection({
  context,
  client,
  onClientChange,
  executiveId,
  onExecutiveChange,
}: AcceptOfferBriloSectionProps) {
  const vallas =
    context.staticItemCount === 1
      ? "la valla estática"
      : `las ${context.staticItemCount} vallas estáticas`;

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <Info />
        <AlertTitle>Se generarán documentos en Brilo</AlertTitle>
        <AlertDescription>
          Al confirmar se creará en Brilo una cotización y un contrato posteado
          con {vallas} para la facturación. Las pantallas digitales y los
          conceptos adicionales no se envían a Brilo.
        </AlertDescription>
      </Alert>

      <div className="space-y-1.5">
        <BriloClientCombobox
          value={client}
          onChange={onClientChange}
          suggestions={context.clientMatches}
        />
        <p className="text-xs text-muted-foreground">{clientHint(context)}</p>
      </div>

      <div className="space-y-1.5">
        <BriloExecutiveCombobox
          executives={context.executives}
          value={executiveId}
          onChange={onExecutiveChange}
          matchIds={context.executiveMatchIds}
        />
        <p className="text-xs text-muted-foreground">
          {executiveHint(context)}
        </p>
      </div>
    </div>
  );
}
