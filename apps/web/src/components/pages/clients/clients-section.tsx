"use client";

import { ClientsTable } from "./clients-table";

export function ClientsSection() {
  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col gap-3">
      <ClientsTable />
    </section>
  );
}
