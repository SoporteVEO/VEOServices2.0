import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  CreateProductionOrderInput,
  ProductionOrder,
} from "./production-orders.types";

export async function createProductionOrder(
  input: CreateProductionOrderInput,
): Promise<ProductionOrder> {
  const response = await apiFetch<{ data: ProductionOrder }>(
    "/production-orders",
    { method: "POST", body: JSON.stringify(input) },
  );
  return response.data;
}

/**
 * Cache invalidation is left to the caller, which still has to upload the
 * per-billboard documents once the order exists.
 */
export function useCreateProductionOrder() {
  return useMutation({ mutationFn: createProductionOrder });
}

export function useInvalidateProductionOrders() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ["production-orders"] });
}
