"use client";

import { MyActiveContractsTable } from "./my-active-contracts-table";
import { MY_SPACE_NAV_ITEMS } from "./const";

const contractsNav = MY_SPACE_NAV_ITEMS.find((item) =>
  item.href.endsWith("/contracts"),
)!;

export function MySpaceContractsSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <header className="shrink-0 space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {contractsNav.title}
        </h1>
      </header>
      <MyActiveContractsTable />
    </section>
  );
}
