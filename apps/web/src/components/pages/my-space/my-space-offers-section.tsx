"use client";

import { GenerateOfferButton } from "./quotation";
import { MyOffersTable } from "./my-offers-table";
import { useMySpaceViewAs } from "./my-space-view-as-context";

export function MySpaceOffersSection() {
  const { viewAsUserId } = useMySpaceViewAs();
  const readOnly = Boolean(viewAsUserId);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {readOnly ? null : (
        <header className="flex shrink-0 items-center justify-end gap-3">
          <GenerateOfferButton />
        </header>
      )}
      <MyOffersTable />
    </section>
  );
}
