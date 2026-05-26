"use client";

import { MyActiveContractsTable } from "./my-active-contracts-table";
import { authClient } from "@/lib/auth-client";

export function MySpaceDashboard() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <header className="shrink-0 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido, {" " + user?.name}
        </h1>
      </header>

      <section className="flex min-h-0 flex-1 flex-col gap-3">
        <MyActiveContractsTable />
      </section>
    </div>
  );
}
