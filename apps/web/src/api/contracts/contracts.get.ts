import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import type { S3ImageType } from "@/api/s3-images/s3-images.get";

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

export interface ActiveContractImage {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  type: S3ImageType;
  uploadedUser: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

export interface ActiveContract {
  contractSourceId: number;
  contractDetailSourceId: number;
  description: string;
  startDate: string;
  endDate: string;
  contractNumber: string;
  billboardCode: string;
  billboardAddress: string;
  billboardLatitude: number | null;
  billboardLongitude: number | null;
  customerName: string;
  customerEmail: string;
  images: ActiveContractImage[];
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

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfNextMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export async function getActiveContracts({ from, to }: { from: Date; to: Date }) {
  const response = await apiFetch<{ data: ActiveContract[] }>(
    "/contracts/active",
    {
      method: "GET",
      query: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    },
  );
  return response.data;
}

export function useActiveContracts(opts?: { from?: Date; to?: Date }) {
  const from = opts?.from ?? startOfCurrentMonth();
  const to = opts?.to ?? startOfNextMonth();

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", "active", from.toISOString(), to.toISOString()],
    queryFn: () => getActiveContracts({ from, to }),
  });
  return { data, isLoading };
}