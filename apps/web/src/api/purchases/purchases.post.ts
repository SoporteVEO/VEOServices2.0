import { apiFetch } from "@/lib/api";
import type { CreatePurchaseInput, CreatePurchaseResponse } from "./purchases.types";

export type { CreatePurchaseInput, CreatePurchaseResponse } from "./purchases.types";

export async function createPurchase(input: CreatePurchaseInput) {
  return apiFetch<CreatePurchaseResponse>("/purchases", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
