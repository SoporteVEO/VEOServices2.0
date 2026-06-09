"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import type { Client } from "@/api/clients/clients.get";
import { useMyProfile, useMyTeamMember } from "@/api/me/me.get";
import { useAttachOfferPdf, useCreateOffer } from "@/api/offers/offers.post";
import type { OfferItemInput } from "@/api/offers/offers.types";
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
import {
  QuotationCustomerForm,
  type QuotationCustomerFormValues,
} from "@/components/pages/static-billboards/quotation/quotation-customer-form";
import { Separator } from "@/components/primitives/ui/separator";
import { DigitalItemsSection } from "./digital-items-section";
import { MiscItemsSection } from "./misc-items-section";
import { OfferPdfDocument } from "./offer-pdf-document";
import {
  computeOfferTotals,
  IVA_RATE,
  type DigitalOfferItem,
  type MiscOfferItem,
  type OfferItem,
  type StaticOfferItem,
} from "./offer-types";
import { OfferTotalsSummary } from "./offer-totals-summary";
import { StaticItemsSection } from "./static-items-section";

const VEO_LOGO_SRC = "/VEO_LOGO_COT.png";

function defaultValidUntil(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d;
}

function fileTimestamp(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function emptyFormValues(): QuotationCustomerFormValues {
  return {
    clientId: null,
    customerName: "",
    customerCompany: "",
    customerEmail: "",
    customerBillingEmail: "",
    customerContact: "",
    validUntil: defaultValidUntil(),
    specialConditions: "",
  };
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el PDF"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("No se pudo leer el PDF"));
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}

function offerItemToInput(item: OfferItem): OfferItemInput {
  const startDate = item.startDate ? item.startDate.toISOString() : null;
  const endDate = item.endDate ? item.endDate.toISOString() : null;

  if (item.type === "STATIC_BILLBOARD") {
    return {
      itemType: "STATIC_BILLBOARD",
      billboardId: item.billboardId,
      billboardCode: item.billboardCode,
      address: item.description,
      cityName: item.cityName,
      departmentName: item.departmentName,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
      impressionPrice: item.impressionPrice,
      rentalPrice: item.rentalPrice,
      taxRate: item.taxRate,
      startDate,
      endDate,
    };
  }

  if (item.type === "DIGITAL_BILLBOARD") {
    return {
      itemType: "DIGITAL_BILLBOARD",
      billboardCode: item.billboardCode,
      address: item.address,
      digitalBillboardId: item.digitalBillboardId,
      spotCount: item.spotCount,
      description: item.name,
      quantity: item.quantity,
      impressionPrice: 0,
      rentalPrice: item.rentalPrice,
      taxRate: item.taxRate,
      startDate,
      endDate,
    };
  }

  return {
    itemType: "MISC",
    description: item.description,
    quantity: item.quantity,
    impressionPrice: 0,
    rentalPrice: item.rentalPrice,
    taxRate: item.taxRate,
    startDate,
    endDate,
  };
}

export interface GenerateOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GenerateOfferModal({
  open,
  onOpenChange,
  onSuccess,
}: GenerateOfferModalProps) {
  const profileQuery = useMyProfile();
  const teamMemberQuery = useMyTeamMember();
  const createMutation = useCreateOffer();
  const attachPdfMutation = useAttachOfferPdf();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [staticItems, setStaticItems] = useState<StaticOfferItem[]>([]);
  const [digitalItems, setDigitalItems] = useState<DigitalOfferItem[]>([]);
  const [miscItems, setMiscItems] = useState<MiscOfferItem[]>([]);

  const advisorFullName = useMemo<string | null>(() => {
    const fromTeamMember = teamMemberQuery.data?.fullName?.trim();
    if (fromTeamMember) return fromTeamMember;
    const profile = profileQuery.data;
    if (!profile) return null;
    const composed = [profile.firstName, profile.lastName]
      .filter((p) => Boolean(p && p.trim()))
      .join(" ")
      .trim();
    return composed || null;
  }, [teamMemberQuery.data, profileQuery.data]);

  const allItems = useMemo<OfferItem[]>(
    () => [...staticItems, ...digitalItems, ...miscItems],
    [staticItems, digitalItems, miscItems],
  );

  const totals = useMemo(() => computeOfferTotals(allItems), [allItems]);

  const form = useForm<QuotationCustomerFormValues>({
    defaultValues: emptyFormValues(),
  });

  function handleSelectClient(client: Client | null) {
    setSelectedClient(client);
    if (!client) {
      form.setValue("clientId", null);
      return;
    }
    form.setValue("clientId", client.id);
    form.setValue("customerName", client.name);
    form.setValue("customerCompany", client.company ?? "");
    form.setValue("customerEmail", client.email);
    form.setValue("customerBillingEmail", client.billingEmail ?? "");
    form.setValue("customerContact", client.contact ?? "");
  }

  function resetState() {
    form.reset(emptyFormValues());
    setSelectedClient(null);
    setStaticItems([]);
    setDigitalItems([]);
    setMiscItems([]);
  }

  function handleClose(nextOpen: boolean) {
    if (isSubmitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) resetState();
  }

  function validateBeforeSubmit(values: QuotationCustomerFormValues): string | null {
    if (allItems.length === 0) {
      return "Agrega al menos una valla o concepto a la cotización.";
    }
    if (!values.validUntil) {
      return "Selecciona la vigencia de la oferta.";
    }
    const staticMissingDates = staticItems.find(
      (item) => !item.startDate || !item.endDate,
    );
    if (staticMissingDates) {
      return `Selecciona la duración de la valla ${staticMissingDates.billboardCode ?? staticMissingDates.billboardId}.`;
    }
    const digitalMissingDates = digitalItems.find(
      (item) => !item.startDate || !item.endDate,
    );
    if (digitalMissingDates) {
      return `Selecciona la duración de la valla digital ${digitalMissingDates.billboardCode ?? digitalMissingDates.name}.`;
    }
    const miscMissingDescription = miscItems.find(
      (item) => !item.description.trim(),
    );
    if (miscMissingDescription) {
      return "Cada concepto adicional debe tener una descripción.";
    }
    return null;
  }

  async function onSubmit(values: QuotationCustomerFormValues) {
    const validationError = validateBeforeSubmit(values);
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createMutation.mutateAsync({
        clientId: values.clientId,
        customerName: values.customerName.trim(),
        customerCompany: values.customerCompany.trim() || null,
        customerEmail: values.customerEmail.trim() || null,
        customerBillingEmail: values.customerBillingEmail.trim() || null,
        customerContact: values.customerContact.trim() || null,
        validUntil: values.validUntil!.toISOString(),
        specialConditions: values.specialConditions.trim() || null,
        items: allItems.map(offerItemToInput),
      });

      const blob = await pdf(
        <OfferPdfDocument
          data={{
            offerNumber: created.offerNumber,
            customerName: values.customerName,
            customerCompany: values.customerCompany,
            customerEmail: values.customerEmail,
            customerBillingEmail: values.customerBillingEmail,
            customerContact: values.customerContact,
            validUntil: values.validUntil!,
            specialConditions: values.specialConditions,
            advisorFullName,
            items: allItems,
          }}
          logoSrc={VEO_LOGO_SRC}
        />,
      ).toBlob();

      const pdfBase64 = await blobToBase64(blob);
      await attachPdfMutation.mutateAsync({ id: created.id, pdfBase64 });

      const fileName = `${created.offerNumber.replace(
        /[\\/:*?"<>|]/g,
        "-",
      )}_${fileTimestamp(new Date())}.pdf`;
      downloadBlob(blob, fileName);

      toast.success(`Cotización ${created.offerNumber} generada.`);
      onOpenChange(false);
      resetState();
      onSuccess?.();
    } catch (err) {
      console.error("Error generating offer:", err);
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo generar la cotización.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="xl" className="sm:max-w-4xl lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Generar Cotización</DialogTitle>
          <DialogDescription>
            Agrega vallas estáticas, digitales o conceptos adicionales y descarga
            la cotización en PDF.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="space-y-6">
            <QuotationCustomerForm
              form={form}
              defaultSelectedClient={selectedClient}
              onSelectClient={handleSelectClient}
            />

            <Separator />

            <StaticItemsSection
              items={staticItems}
              onChange={setStaticItems}
            />

            <DigitalItemsSection
              items={digitalItems}
              onChange={setDigitalItems}
            />

            <MiscItemsSection items={miscItems} onChange={setMiscItems} />

            {allItems.length > 0 ? (
              <>
                <Separator />
                <OfferTotalsSummary totals={totals} />
              </>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || allItems.length === 0}
              icon={isSubmitting ? Loader2 : Download}
              iconClassName={isSubmitting ? "animate-spin" : undefined}
            >
              {isSubmitting ? "Generando..." : "Descargar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { IVA_RATE };
