import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface EndingSoonContract {
  contractSourceId: number;
  contractDetailSourceId: number;
  description: string;
  startDate: string;
  endDate: string;
  contractNumber: string;
  billboardAddress: string;
  customerName: string;
  customerEmail: string;
}

export interface NotifiedContract {
  id: string;
  contractSourceId: number;
  contractDetailSourceId: number;
  contractNumber: string;
  status: "PENDING" | "SENT" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
}

export async function getEndingSoonContracts({ from, to }: { from: Date, to: Date }) {
  const response = await apiFetch<{ data: EndingSoonContract[] }>("/contracts/ending-soon", {
    method: "GET",
    query: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
  });
  return response.data;
}

export function useEndingSoonContracts({ from, to }: { from: Date, to: Date }) {
  const { data, isLoading } = useQuery({
    queryKey: ["contracts", "ending-soon"],
    queryFn: () => getEndingSoonContracts({ from, to }),
    enabled: !!from && !!to,
  });
  return { data, isLoading };
}

export async function getNotifiedContracts() {
  const response =
    await apiFetch<{ data: NotifiedContract[] }>("/contracts/notified");
  return response.data;
}

export function useNotifiedContracts() {
  const { data, isLoading } = useQuery({
    queryKey: ["contracts", "notified"],
    queryFn: getNotifiedContracts,
  });
  return { data, isLoading };
}