"use client";

import { usePurchases } from "@/api/purchases/purchases.get";
import { PurchasesTable } from "@/components/pages/purchases";

export default function PurchasesPage() {
  const { data, isLoading } = usePurchases();

  return (
    <section>
      <PurchasesTable purchases={data ?? []} isLoading={isLoading} />
    </section>
  );
}
