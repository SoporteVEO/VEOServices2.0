import { apiFetch } from "@/lib/api";
import type { CartItem } from "@/lib/cart-store";

export type PaypalOrderCreateResponse = {
  id: string;
};

export async function createPaypalOrder(cart: CartItem[]) {
  return apiFetch<PaypalOrderCreateResponse>("/paypal/orders", {
    method: "POST",
    body: JSON.stringify({ cart }),
  });
}

export async function capturePaypalOrder(orderId: string) {
  return apiFetch<unknown>(`/paypal/orders/${orderId}/capture`, {
    method: "POST",
  });
}
