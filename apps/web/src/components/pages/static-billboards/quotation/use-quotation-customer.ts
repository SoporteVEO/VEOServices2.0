import { useState } from "react";
import type { Client } from "@/api/clients/clients.get";
import { useCrmContacts } from "@/api/crm/crm.get";
import type { CrmContact } from "@/api/crm/crm.types";
import {
  buildCustomerFields,
  type QuotationCustomerFields,
} from "./quotation-customer-fields";

interface Options {
  initialClient?: Client | null;
  /** Editing an offer keeps its stored customer data until the user picks another client or contact. */
  keepSnapshot?: boolean;
}

export function useQuotationCustomer({
  initialClient = null,
  keepSnapshot = false,
}: Options = {}) {
  const [client, setClient] = useState<Client | null>(initialClient);
  const [chosenContact, setChosenContact] = useState<
    CrmContact | null | undefined
  >(undefined);
  const [touched, setTouched] = useState(false);

  const preserved = keepSnapshot && !touched;
  const contactsQuery = useCrmContacts(
    { clientId: client?.id, pageSize: 50 },
    !!client && !preserved,
  );

  const primaryContact =
    contactsQuery.data?.data.find((contact) => contact.isPrimary) ?? null;
  const contact =
    chosenContact !== undefined
      ? chosenContact
      : preserved
        ? null
        : primaryContact;

  const fields: QuotationCustomerFields | null = preserved
    ? null
    : buildCustomerFields(client, contact);

  function selectClient(next: Client | null) {
    setClient(next);
    setChosenContact(undefined);
    setTouched(true);
  }

  function selectContact(next: CrmContact | null) {
    setChosenContact(next);
    setTouched(true);
  }

  function reset() {
    setClient(null);
    setChosenContact(undefined);
    setTouched(false);
  }

  return {
    client,
    contact,
    fields,
    isResolvingContact: !!client && !preserved && contactsQuery.isLoading,
    selectClient,
    selectContact,
    reset,
  };
}
