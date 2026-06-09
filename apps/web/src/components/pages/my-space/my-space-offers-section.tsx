"use client";

import { GenerateOfferButton } from "./quotation";
import { MyOffersTable } from "./my-offers-table";
import { MY_SPACE_NAV_ITEMS } from "./const";
import { useMySpaceViewAs } from "./my-space-view-as-context";

const offersNav = MY_SPACE_NAV_ITEMS.find((item) =>
  item.href.endsWith("/offers"),
)!;

export function MySpaceOffersSection() {
  const { viewAsUserId } = useMySpaceViewAs();
  const readOnly = Boolean(viewAsUserId);

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {offersNav.title}
        </h1>
        {readOnly ? null : <GenerateOfferButton />}
      </header>
      <MyOffersTable />
    </section>
  );
}
