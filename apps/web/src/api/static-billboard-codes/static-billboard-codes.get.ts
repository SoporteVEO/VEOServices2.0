import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface StaticBillboardCode {
  id: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export async function getStaticBillboardCodes() {
  const response = await apiFetch<{ data: StaticBillboardCode[] }>(
    "/static-billboard-codes",
  );
  return response.data;
}

export function useStaticBillboardCodes() {
  const { data, isLoading } = useQuery({
    queryKey: ["static-billboard-codes"],
    queryFn: getStaticBillboardCodes,
  });

  return { data, isLoading };
}
