"use client";

import { ClientsTable } from "./clients-table";

export function ClientsSection() {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <ClientsTable />
    </section>
  );
}
