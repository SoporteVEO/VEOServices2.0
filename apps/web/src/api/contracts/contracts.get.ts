import { apiFetch } from "@/lib/api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
  description: string | null;
  startDate: string;
  endDate: string;
  contractNumber: string;
  billboardCode: string;
  billboardAddress: string | null;
  billboardLatitude: number | null;
  billboardLongitude: number | null;
  customerName: string | null;
  customerEmail: string | null;
  images: ActiveContractImage[];
}

export interface ActiveContractGroup {
  contractNumber: string;
  contractSourceId: number;
  description: string | null;
  customerName: string | null;
  customerEmail: string | null;
  startDate: string;
  endDate: string;
  billboards: ActiveContract[];
  totalBillboards: number;
  totalImages: number;
  billboardsWithImages: number;
  reportsSendedCount: number;
}

export interface ContractReportSendedRow {
  id: string;
  createdAt: string;
  sentToEmail: string | null;
  reportType: "monthly" | "installation" | "maintenance";
  sentBy: {
    firstName: string;
    lastName: string | null;
    email: string;
  };
}

export interface ActiveContractsPage {
  data: ActiveContractGroup[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActiveContractsQuery {
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
  search?: string;
  imageType?: S3ImageType;
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

export async function getActiveContracts(query: ActiveContractsQuery = {}) {
  const from = query.from ?? startOfCurrentMonth();
  const to = query.to ?? startOfNextMonth();

  const params: Record<string, string> = {
    from: from.toISOString(),
    to: to.toISOString(),
  };
  if (query.page) params.page = String(query.page);
  if (query.pageSize) params.pageSize = String(query.pageSize);
  if (query.search) params.search = query.search;
  if (query.imageType) params.imageType = query.imageType;

  return apiFetch<ActiveContractsPage>("/contracts/active", {
    method: "GET",
    query: params,
  });
}

export function useActiveContracts(query: ActiveContractsQuery = {}) {
  const from = query.from ?? startOfCurrentMonth();
  const to = query.to ?? startOfNextMonth();
  const normalized: ActiveContractsQuery = {
    from,
    to,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    imageType: query.imageType,
  };

  return useQuery({
    queryKey: [
      "contracts",
      "active",
      from.toISOString(),
      to.toISOString(),
      normalized.page ?? 1,
      normalized.pageSize ?? null,
      normalized.search ?? "",
      normalized.imageType ?? "",
    ],
    queryFn: () => getActiveContracts(normalized),
    placeholderData: keepPreviousData,
  });
}

export async function getContractReportsSended(params: {
  contractNumber: string;
  reportType: "monthly" | "installation" | "maintenance";
}) {
  const response = await apiFetch<{ data: ContractReportSendedRow[] }>(
    "/contracts/reports-sended",
    {
      method: "GET",
      query: {
        contractNumber: params.contractNumber,
        reportType: params.reportType,
      },
    },
  );
  return response.data;
}

export function useContractReportsSended(params: {
  contractNumber: string | null;
  reportType: "monthly" | "installation" | "maintenance";
}) {
  return useQuery({
    queryKey: [
      "contracts",
      "reports-sended",
      params.contractNumber ?? "",
      params.reportType,
    ],
    queryFn: () =>
      getContractReportsSended({
        contractNumber: params.contractNumber!,
        reportType: params.reportType,
      }),
    enabled: !!params.contractNumber,
  });
}