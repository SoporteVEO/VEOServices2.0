import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  PrintBacklogItem,
  PrintJob,
  PrintingMachine,
} from "./printing.types";

const STALE_TIME = 30 * 1000;
const GC_TIME = 5 * 60 * 1000;

export const printingKeys = {
  all: ["printing"] as const,
  machines: () => ["printing", "machines"] as const,
  jobs: (from: string, to: string) => ["printing", "jobs", from, to] as const,
  backlog: (search: string) => ["printing", "backlog", search] as const,
};

export async function getPrintingMachines(): Promise<PrintingMachine[]> {
  const response = await apiFetch<{ data: PrintingMachine[] }>(
    "/printing/machines",
  );
  return response.data;
}

export function usePrintingMachines(enabled = true) {
  return useQuery({
    queryKey: printingKeys.machines(),
    queryFn: getPrintingMachines,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: GC_TIME,
  });
}

export async function getPrintJobs(
  from: string,
  to: string,
): Promise<PrintJob[]> {
  const response = await apiFetch<{ data: PrintJob[] }>("/printing/jobs", {
    query: { from, to },
  });
  return response.data;
}

/**
 * `from`/`to` are full ISO instants so the server window matches the local-time
 * day columns the calendar renders.
 */
export function usePrintJobs(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: printingKeys.jobs(from, to),
    queryFn: () => getPrintJobs(from, to),
    enabled: enabled && Boolean(from && to),
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}

export async function getPrintBacklog(
  search?: string,
): Promise<PrintBacklogItem[]> {
  const response = await apiFetch<{ data: PrintBacklogItem[] }>(
    "/printing/backlog",
    { query: search ? { search } : {} },
  );
  return response.data;
}

export function usePrintBacklog(search = "", enabled = true) {
  return useQuery({
    queryKey: printingKeys.backlog(search),
    queryFn: () => getPrintBacklog(search || undefined),
    enabled,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    placeholderData: keepPreviousData,
  });
}
