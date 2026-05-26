"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import type { AvailableBillboardListing } from "@/api/billboards/billboards.get";
import type { Client } from "@/api/clients/clients.get";
import { useMyProfile, useMyTeamMember } from "@/api/me/me.get";
import { useAttachOfferPdf, useCreateOffer } from "@/api/offers/offers.post";
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
import { QuotationCustomerForm } from "./quotation-customer-form";
import type { QuotationCustomerFormValues } from "./quotation-customer-form";
import { QuotationItemsTable } from "./quotation-items-table";
import { QuotationPdfDocument } from "./quotation-pdf-document";
import {
  applyQuotationItemDateRange,
  billboardToQuotationItem,
  type QuotationItem,
} from "./quotation-types";
import {
  dateRangeOverlapsOccupied,
  resolveDefaultQuotationDateRange,
  type ContractRange,
} from "../detail/billboard-detail-utils";
import { useQuotationBillboardContractRanges } from "./use-quotation-billboard-contracts";

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

function buildQuotationItems(
  billboards: AvailableBillboardListing[],
  defaultStartDate: Date | null,
  defaultEndDate: Date | null,
): QuotationItem[] {
  return billboards.map((b) =>
    billboardToQuotationItem(b, {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    }),
  );
}

export interface GenerateQuotationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billboards: AvailableBillboardListing[];
  logoSrc: string;
  defaultStartDate?: Date | null;
  defaultEndDate?: Date | null;
  onSuccess?: () => void;
}

export function GenerateQuotationModal({
  open,
  onOpenChange,
  billboards,
  logoSrc,
  defaultStartDate = null,
  defaultEndDate = null,
  onSuccess,
}: GenerateQuotationModalProps) {
  const profileQuery = useMyProfile();
  const teamMemberQuery = useMyTeamMember();
  const createMutation = useCreateOffer();
  const attachPdfMutation = useAttachOfferPdf();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

  const [items, setItems] = useState<QuotationItem[]>(() =>
    buildQuotationItems(billboards, defaultStartDate, defaultEndDate),
  );
  const datesSanitizedForKeyRef = useRef<string | null>(null);
  const contractRangesRef = useRef<Map<number, ContractRange[]>>(new Map());
  const [billboardsKey, setBillboardsKey] = useState(() =>
    billboards.map((b) => b.billboardId).join(","),
  );

  const nextBillboardsKey = useMemo(
    () => billboards.map((b) => b.billboardId).join(","),
    [billboards],
  );

  const billboardIds = useMemo(
    () => billboards.map((b) => b.billboardId),
    [nextBillboardsKey],
  );

  if (nextBillboardsKey !== billboardsKey) {
    setBillboardsKey(nextBillboardsKey);
    setItems(
      buildQuotationItems(billboards, defaultStartDate, defaultEndDate),
    );
    datesSanitizedForKeyRef.current = null;
  }

  const { contractRangesByBillboardId, isContractsReady } =
    useQuotationBillboardContractRanges(billboardIds, open);

  contractRangesRef.current = contractRangesByBillboardId;

  useEffect(() => {
    if (!open) {
      datesSanitizedForKeyRef.current = null;
      return;
    }
    if (!isContractsReady) return;

    const sanitizeKey = `${nextBillboardsKey}|${defaultStartDate?.toISOString() ?? ""}|${defaultEndDate?.toISOString() ?? ""}`;
    if (datesSanitizedForKeyRef.current === sanitizeKey) return;
    datesSanitizedForKeyRef.current = sanitizeKey;

    setItems((prev) =>
      prev.map((item) => {
        const ranges =
          contractRangesRef.current.get(item.billboardId) ?? [];
        const overlaps = dateRangeOverlapsOccupied(
          item.startDate,
          item.endDate,
          ranges,
        );
        if (!overlaps) return item;

        const resolved = resolveDefaultQuotationDateRange(
          defaultStartDate,
          defaultEndDate,
          ranges,
        );
        return applyQuotationItemDateRange(
          item,
          resolved.startDate,
          resolved.endDate,
        );
      }),
    );
  }, [
    open,
    isContractsReady,
    nextBillboardsKey,
    defaultStartDate,
    defaultEndDate,
  ]);

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

  function handleClose(nextOpen: boolean) {
    if (isSubmitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) {
      form.reset(emptyFormValues());
      setSelectedClient(null);
    }
  }

  async function onSubmit(values: QuotationCustomerFormValues) {
    if (items.length === 0) {
      toast.warning("Agrega al menos una valla a la cotización.");
      return;
    }
    if (!values.validUntil) {
      toast.warning("Selecciona la vigencia de la oferta.");
      return;
    }

    const itemWithoutDuration = items.find(
      (item) => !item.startDate || !item.endDate,
    );
    if (itemWithoutDuration) {
      toast.warning(
        `Selecciona la duración de la valla ${itemWithoutDuration.billboardCode ?? itemWithoutDuration.billboardId}.`,
      );
      return;
    }

    const itemWithOccupiedRange = items.find((item) =>
      dateRangeOverlapsOccupied(
        item.startDate,
        item.endDate,
        contractRangesRef.current.get(item.billboardId) ??
          contractRangesByBillboardId.get(item.billboardId) ??
          [],
      ),
    );
    if (itemWithOccupiedRange) {
      toast.warning(
        `La valla ${itemWithOccupiedRange.billboardCode ?? itemWithOccupiedRange.billboardId} tiene fechas que coinciden con un contrato existente.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Persist the offer metadata first so the server assigns the real
      //    offer number. The PDF is attached in step 2 once we know it.
      const created = await createMutation.mutateAsync({
        clientId: values.clientId,
        customerName: values.customerName.trim(),
        customerCompany: values.customerCompany.trim() || null,
        customerEmail: values.customerEmail.trim() || null,
        customerBillingEmail: values.customerBillingEmail.trim() || null,
        customerContact: values.customerContact.trim() || null,
        validUntil: values.validUntil.toISOString(),
        specialConditions: values.specialConditions.trim() || null,
        items: items.map((item) => ({
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
          startDate: item.startDate ? item.startDate.toISOString() : null,
          endDate: item.endDate ? item.endDate.toISOString() : null,
        })),
      });

      // 2. Render the PDF with the real offer number returned by the server.
      const blob = await pdf(
        <QuotationPdfDocument
          data={{
            offerNumber: created.offerNumber,
            customerName: values.customerName,
            customerCompany: values.customerCompany,
            customerEmail: values.customerEmail,
            customerBillingEmail: values.customerBillingEmail,
            customerContact: values.customerContact,
            validUntil: values.validUntil,
            specialConditions: values.specialConditions,
            advisorFullName,
            items,
          }}
          logoSrc={logoSrc}
        />,
      ).toBlob();

      // 3. Upload the rendered PDF to the offer so it can be re-downloaded
      //    later from S3 with the same offer number that's printed on it.
      const pdfBase64 = await blobToBase64(blob);
      await attachPdfMutation.mutateAsync({ id: created.id, pdfBase64 });

      const fileName = `${created.offerNumber.replace(
        /[\\/:*?"<>|]/g,
        "-",
      )}_${fileTimestamp(new Date())}.pdf`;
      downloadBlob(blob, fileName);

      toast.success(`Cotización ${created.offerNumber} generada.`);
      onOpenChange(false);
      setItems([]);
      setSelectedClient(null);
      form.reset(emptyFormValues());
      onSuccess?.();
    } catch (err) {
      console.error("Error generating quotation:", err);
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
            Selecciona o registra un cliente, revisa los precios y duración por
            valla, y descarga la cotización en PDF.
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

            <QuotationItemsTable
              items={items}
              contractRangesByBillboardId={contractRangesByBillboardId}
              onChange={setItems}
            />
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
              disabled={isSubmitting || items.length === 0}
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
