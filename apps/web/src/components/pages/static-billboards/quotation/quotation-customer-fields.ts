import type { Client } from "@/api/clients/clients.get";
import type { CrmContact } from "@/api/crm/crm.types";
import { personName } from "@/components/pages/crm/crm-format";

export interface QuotationCustomerFields {
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerBillingEmail: string;
  customerContact: string;
}

export const EMPTY_CUSTOMER_FIELDS: QuotationCustomerFields = {
  customerName: "",
  customerCompany: "",
  customerEmail: "",
  customerBillingEmail: "",
  customerContact: "",
};

/** Contact details win; legacy client data only fills what the contact lacks. */
export function buildCustomerFields(
  client: Client | null,
  contact: CrmContact | null,
): QuotationCustomerFields {
  if (!client) return EMPTY_CUSTOMER_FIELDS;
  return {
    customerName: client.name,
    customerCompany: "",
    customerEmail: contact?.email || client.email || "",
    customerBillingEmail: client.billingEmail ?? "",
    customerContact: contact ? personName(contact) : (client.contact ?? ""),
  };
}
