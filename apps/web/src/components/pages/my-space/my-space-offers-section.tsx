"use client";

import { MyOffersTable } from "./my-offers-table";
import { MY_SPACE_NAV_ITEMS } from "./const";

const offersNav = MY_SPACE_NAV_ITEMS.find((item) =>
  item.href.endsWith("/offers"),
)!;

export function MySpaceOffersSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="shrink-0 space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {offersNav.title}
        </h1>
      </header>
      <MyOffersTable />
    </section>
  );
}
