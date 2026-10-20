"use client";

import { MyActiveContractsTable } from "./my-active-contracts-table";

export function MySpaceContractsSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <MyActiveContractsTable />
    </section>
  );
}
