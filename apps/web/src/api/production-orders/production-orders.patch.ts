import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { patchProductionOrderWithUpdatedItem } from "@/components/pages/production-orders-shared/production-order-utils";
import { uploadBlobToPresignedUrl } from "@/lib/upload-blob-to-presigned-url";
import type {
  PaginatedProductionOrders,
  ProductionOrder,
  ProductionOrderItem,
  ProductionOrderStatus,
} from "./production-orders.types";

/** Uploads the file straight to S3, then links it to the billboard. */
export async function uploadProductionOrderArt(input: {
  itemId: string;
  file: File;
}): Promise<ProductionOrderItem> {
  const { itemId, file } = input;
  const { key, url } = await apiFetch<{ key: string; url: string }>(
    `/production-orders/items/${itemId}/art/upload-url`,
    { method: "POST", body: JSON.stringify({ mimeType: file.type }) },
  );
  await uploadBlobToPresignedUrl({ url, blob: file, contentType: file.type });

  const response = await apiFetch<{ data: ProductionOrderItem }>(
    `/production-orders/items/${itemId}/art`,
    {
      method: "PATCH",
      body: JSON.stringify({
        fileKey: key,
        fileName: file.name,
        mimeType: file.type,
      }),
    },
  );
  return response.data;
}

export function useUploadProductionOrderArt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProductionOrderArt,
    onSuccess: (updatedItem) => applyItemToCaches(queryClient, updatedItem),
  });
}

export async function deleteProductionOrderArt(
  itemId: string,
): Promise<ProductionOrderItem> {
  const response = await apiFetch<{ data: ProductionOrderItem }>(
    `/production-orders/items/${itemId}/art`,
    { method: "DELETE" },
  );
  return response.data;
}

export function useDeleteProductionOrderArt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProductionOrderArt,
    onSuccess: (updatedItem) => applyItemToCaches(queryClient, updatedItem),
  });
}

export interface UpdateProductionOrderItemAssignmentInput {
  itemId: string;
  assignedInstallerId?: string | null;
  assignedVulcanizadorId?: string | null;
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
