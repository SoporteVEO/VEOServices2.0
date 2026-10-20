"use client";

import { pdf } from "@react-pdf/renderer";
import type { DigitalOrder } from "@/api/pantallas/pantallas.types";
import { downloadBlob } from "@/lib/pdf-download";
import { OrderPdfDocument } from "./order-pdf-document";
import { orderLabel } from "./pantallas-orders-logic";

export async function downloadOrderPdf(order: DigitalOrder) {
  const blob = await pdf(<OrderPdfDocument order={order} />).toBlob();
  downloadBlob(blob, `${orderLabel(order).replace(/[\\/:*?"<>|\s]+/g, "_")}.pdf`);
}
