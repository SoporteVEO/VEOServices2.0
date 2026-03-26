import type { CartItem } from "@/lib/cart-store";

export type PurchaseItem = {
  id: string;
  billboardId: number | null;
  digitalBillboardId: string | null;
  spotCount: number | null;
  billboardCode: string | null;
  reference: string | null;
  departmentName: string | null;
  cityName: string | null;
  address: string | null;
  price: number | null;
  from: string;
  to: string;
};

export type PurchaseRow = {
  id: string;
  createdAt: string;
  status: string;
  paypalOrderId: string | null;
  customerEmail: string;
  customerName: string | null;
  items: PurchaseItem[];
};

export type CreatePurchaseInput = {
  paypalOrderId: string;
  email: string;
  items: CartItem[];
};

export type CreatePurchaseResponse = {
  id: string;
  paypalOrderId: string | null;
  itemCount: number;
};
