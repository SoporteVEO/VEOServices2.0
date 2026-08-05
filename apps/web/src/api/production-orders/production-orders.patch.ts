import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ProductionDocumentKind,
  ProductionOrderItem,
  ProductionOrderStatus,
} from "./production-orders.types";

function documentPath(kind: ProductionDocumentKind, itemId: string): string {
  return kind === "PRODUCTION"
    ? `/production-orders/items/${itemId}/production-document`
    : `/production-orders/items/${itemId}/design-document`;
}

export async function uploadProductionOrderDocument(input: {
  itemId: string;
  kind: ProductionDocumentKind;
  pdfBase64: string;
}): Promise<ProductionOrderItem> {
  const response = await apiFetch<{ data: ProductionOrderItem }>(
    documentPath(input.kind, input.itemId),
    {
      method: "PATCH",
      body: JSON.stringify({ pdfBase64: input.pdfBase64 }),
    },
  );
  return response.data;
}

export function useUploadProductionOrderDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProductionOrderDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    },
  });
}

export async function deleteProductionOrderDocument(input: {
  itemId: string;
  kind: ProductionDocumentKind;
}): Promise<ProductionOrderItem> {
  const response = await apiFetch<{ data: ProductionOrderItem }>(
    documentPath(input.kind, input.itemId),
    { method: "DELETE" },
  );
  return response.data;
}

export function useDeleteProductionOrderDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductionOrderDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    },
  });
}

export async function updateProductionOrderItemStatus(input: {
  itemId: string;
  status: ProductionOrderStatus;
}): Promise<ProductionOrderItem> {
  const response = await apiFetch<{ data: ProductionOrderItem }>(
    `/production-orders/items/${input.itemId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: input.status }),
    },
  );
  return response.data;
}

export function useUpdateProductionOrderItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductionOrderItemStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["production-orders"] });
    },
  });
}
