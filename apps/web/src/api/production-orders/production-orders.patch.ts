import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { patchProductionOrderWithUpdatedItem } from "@/components/pages/production-orders-shared/production-order-utils";
import type {
  PaginatedProductionOrders,
  ProductionDocumentKind,
  ProductionOrder,
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

export interface UpdateProductionOrderItemAssignmentInput {
  itemId: string;
  assignedInstallerId?: string | null;
  scheduledInstallationAt?: string | null;
}

export async function updateProductionOrderItemAssignment({
  itemId,
  ...body
}: UpdateProductionOrderItemAssignmentInput): Promise<ProductionOrderItem> {
  const response = await apiFetch<{ data: ProductionOrderItem }>(
    `/production-orders/items/${itemId}/assignment`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return response.data;
}

export function useUpdateProductionOrderItemAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProductionOrderItemAssignment,
    onSuccess: (updatedItem) => applyItemToCaches(queryClient, updatedItem),
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
    onSuccess: (updatedItem) => applyItemToCaches(queryClient, updatedItem),
  });
}

/**
 * Patches the updated item into the cached order instead of refetching, which
 * keeps the drawer's billboard list from jumping around while the user works.
 */
function applyItemToCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedItem: ProductionOrderItem,
) {
  queryClient.setQueriesData<ProductionOrder>(
    { queryKey: ["production-orders", "detail"] },
    (old) => {
      if (!old?.items.some((item) => item.id === updatedItem.id)) return old;
      return patchProductionOrderWithUpdatedItem(old, updatedItem);
    },
  );

  queryClient.setQueriesData<PaginatedProductionOrders>(
    {
      predicate: (query) =>
        query.queryKey[0] === "production-orders" &&
        (query.queryKey[1] === "all" || query.queryKey[1] === "mine"),
    },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((order) =>
          order.items.some((item) => item.id === updatedItem.id)
            ? patchProductionOrderWithUpdatedItem(order, updatedItem)
            : order,
        ),
      };
    },
  );
}
