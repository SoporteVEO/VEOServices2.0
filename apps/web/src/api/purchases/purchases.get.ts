import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

import type { PurchaseRow } from "./purchases.types";

export type { PurchaseRow } from "./purchases.types";

export async function getPurchases() {
  const response = await apiFetch<{ data: PurchaseRow[] }>("/purchases");
  return response.data;
}

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: getPurchases,
  });
}
