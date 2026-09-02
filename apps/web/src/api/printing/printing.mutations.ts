import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { printingKeys } from "./printing.get";
import { computePrintMinutes } from "./printing.print-time";
import type {
  PrintBacklogItem,
  PrintJob,
  PrintJobAction,
  PrintingMachine,
} from "./printing.types";

const JOBS_KEY = ["printing", "jobs"] as const;
const BACKLOG_KEY = ["printing", "backlog"] as const;
const PRODUCTION_ORDERS_KEY = ["production-orders"] as const;

const MINUTE_MS = 60 * 1000;

type Snapshot = [QueryKey, unknown][];

/** Every cached calendar window, keyed by its `[from, to]` range. */
function jobWindows(queryClient: QueryClient) {
  return queryClient.getQueriesData<PrintJob[]>({ queryKey: JOBS_KEY });
}

/** Every cached backlog list, one per active search term. */
function backlogLists(queryClient: QueryClient) {
  return queryClient.getQueriesData<PrintBacklogItem[]>({
    queryKey: BACKLOG_KEY,
  });
}

function restoreSnapshot(queryClient: QueryClient, snapshot: Snapshot) {
  for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
}

/** Whether a job starts inside the `[from, to]` window a query key describes. */
function windowHoldsJob(key: QueryKey, job: PrintJob): boolean {
  const [, , from, to] = key;
  if (typeof from !== "string" || typeof to !== "string") return true;
  const start = Date.parse(job.scheduledStartAt);
  return start >= Date.parse(from) && start < Date.parse(to);
}

/**
 * Writes a job into every cached window it belongs to and removes it from the
 * ones it no longer does, so moving a bar across weeks stays consistent without
 * a refetch. `replacesId` swaps out the provisional id of an optimistic bar.
 */
function writeJob(
  queryClient: QueryClient,
  job: PrintJob,
  replacesId?: string,
) {
  for (const [key, jobs] of jobWindows(queryClient)) {
    if (!jobs) continue;
    const rest = jobs.filter(
      (candidate) => candidate.id !== job.id && candidate.id !== replacesId,
    );
    queryClient.setQueryData(
      key,
      windowHoldsJob(key, job) ? [...rest, job] : rest,
    );
  }
}

function dropJob(queryClient: QueryClient, jobId: string) {
  for (const [key, jobs] of jobWindows(queryClient)) {
    if (!jobs) continue;
    queryClient.setQueryData(
      key,
      jobs.filter((job) => job.id !== jobId),
    );
  }
}

function dropBacklogItem(queryClient: QueryClient, itemId: string) {
  for (const [key, items] of backlogLists(queryClient)) {
    if (!items) continue;
    queryClient.setQueryData(
      key,
      items.filter((item) => item.id !== itemId),
    );
  }
}

function findJob(queryClient: QueryClient, jobId: string): PrintJob | null {
  for (const [, jobs] of jobWindows(queryClient)) {
    const found = jobs?.find((job) => job.id === jobId);
    if (found) return found;
  }
  return null;
}

async function freezeJobs(queryClient: QueryClient): Promise<Snapshot> {
  // An in-flight window refetch would otherwise land after the optimistic
  // write and put the bar back where it came from.
  await queryClient.cancelQueries({ queryKey: JOBS_KEY });
  return jobWindows(queryClient);
}

export interface SchedulePrintJobInput {
  productionOrderItemId: string;
  machineId: string;
  scheduledStartAt: string;
  setupMinutes?: number;
  printMinutes?: number;
  cooldownMinutes?: number;
  notes?: string | null;
}

export interface SchedulePrintJobVariables {
  input: SchedulePrintJobInput;
  /** Provisional bar rendered until the server answers. */
  optimisticJob?: PrintJob;
}

export async function schedulePrintJob(
  input: SchedulePrintJobInput,
): Promise<PrintJob> {
  const response = await apiFetch<{ data: PrintJob }>("/printing/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.data;
}

export function useSchedulePrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input }: SchedulePrintJobVariables) =>
      schedulePrintJob(input),
    onMutate: async ({ input, optimisticJob }) => {
      const snapshot: Snapshot = [
        ...(await freezeJobs(queryClient)),
        ...backlogLists(queryClient),
      ];
      dropBacklogItem(queryClient, input.productionOrderItemId);
      if (optimisticJob) writeJob(queryClient, optimisticJob);
      return { snapshot, temporaryId: optimisticJob?.id };
    },
    onError: (_error, _variables, context) => {
      if (context) restoreSnapshot(queryClient, context.snapshot);
    },
    onSuccess: (job, _variables, context) => {
      writeJob(queryClient, job, context?.temporaryId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: BACKLOG_KEY });
      void queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDERS_KEY });
    },
  });
}

export interface UpdatePrintJobInput {
  jobId: string;
  machineId?: string;
  scheduledStartAt?: string;
  setupMinutes?: number;
  printMinutes?: number;
  cooldownMinutes?: number;
  notes?: string | null;
}

export async function updatePrintJob({
  jobId,
  ...body
}: UpdatePrintJobInput): Promise<PrintJob> {
  const response = await apiFetch<{ data: PrintJob }>(
    `/printing/jobs/${jobId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return response.data;
}

/** Applies a pending edit locally, mirroring how the server derives the end. */
function patchJob(
  queryClient: QueryClient,
  job: PrintJob,
  patch: UpdatePrintJobInput,
): PrintJob {
  const scheduledStartAt = patch.scheduledStartAt ?? job.scheduledStartAt;
  const machineId = patch.machineId ?? job.machineId;
  const machines = queryClient.getQueryData<PrintingMachine[]>(
    printingKeys.machines(),
  );
  const target = machines?.find((machine) => machine.id === machineId);

  const setupMinutes = patch.setupMinutes ?? job.setupMinutes;
  const cooldownMinutes = patch.cooldownMinutes ?? job.cooldownMinutes;
  // The server re-times a job that changes press, since duration follows
  // throughput; mirroring that here keeps the bar from jumping on response.
  const printMinutes =
    patch.printMinutes ??
    (machineId !== job.machineId && target
      ? computePrintMinutes(job.areaM2, target.printSpeedM2PerHour)
      : job.printMinutes);
  const plannedTotalMinutes = setupMinutes + printMinutes + cooldownMinutes;

  return {
    ...job,
    machineId,
    machineName: target?.name ?? job.machineName,
    scheduledStartAt,
    scheduledEndAt: new Date(
      Date.parse(scheduledStartAt) + plannedTotalMinutes * MINUTE_MS,
    ).toISOString(),
    setupMinutes,
    printMinutes,
    cooldownMinutes,
    plannedTotalMinutes,
    notes: patch.notes ?? job.notes,
  };
}

export function useUpdatePrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrintJob,
    onMutate: async (variables) => {
      const snapshot = await freezeJobs(queryClient);
      const current = findJob(queryClient, variables.jobId);
      if (current) {
        writeJob(queryClient, patchJob(queryClient, current, variables));
      }
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) restoreSnapshot(queryClient, context.snapshot);
    },
    onSuccess: (job) => writeJob(queryClient, job),
  });
}

export async function advancePrintJob(input: {
  jobId: string;
  action: PrintJobAction;
}): Promise<PrintJob> {
  const response = await apiFetch<{ data: PrintJob }>(
    `/printing/jobs/${input.jobId}/advance`,
    { method: "PATCH", body: JSON.stringify({ action: input.action }) },
  );
  return response.data;
}

/** Phase transitions stamp server timestamps and can flip the item status. */
export function useAdvancePrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: advancePrintJob,
    onSuccess: (job) => {
      writeJob(queryClient, job);
      void queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDERS_KEY });
    },
  });
}

export async function cancelPrintJob(jobId: string): Promise<PrintJob> {
  const response = await apiFetch<{ data: PrintJob }>(
    `/printing/jobs/${jobId}/cancel`,
    { method: "PATCH" },
  );
  return response.data;
}

export function useCancelPrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelPrintJob,
    onSuccess: (job) => {
      writeJob(queryClient, job);
      void queryClient.invalidateQueries({ queryKey: BACKLOG_KEY });
      void queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDERS_KEY });
    },
  });
}

export async function deletePrintJob(jobId: string): Promise<void> {
  await apiFetch(`/printing/jobs/${jobId}`, { method: "DELETE" });
}

export function useDeletePrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePrintJob,
    onMutate: async (jobId) => {
      const snapshot = await freezeJobs(queryClient);
      dropJob(queryClient, jobId);
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      if (context) restoreSnapshot(queryClient, context.snapshot);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: BACKLOG_KEY });
      void queryClient.invalidateQueries({ queryKey: PRODUCTION_ORDERS_KEY });
    },
  });
}

export interface UpdatePrintingMachineInput {
  machineId: string;
  name?: string;
  setupMinutes?: number;
  cooldownMinutes?: number;
  printSpeedM2PerHour?: number;
  dailyCapacityM2?: number;
  isActive?: boolean;
}

export async function updatePrintingMachine({
  machineId,
  ...body
}: UpdatePrintingMachineInput): Promise<PrintingMachine> {
  const response = await apiFetch<{ data: PrintingMachine }>(
    `/printing/machines/${machineId}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return response.data;
}

/** Renaming a machine changes the label carried on every one of its bars. */
function useInvalidateMachines() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: printingKeys.machines() });
    void queryClient.invalidateQueries({ queryKey: JOBS_KEY });
  };
}

export function useUpdatePrintingMachine() {
  const invalidate = useInvalidateMachines();
  return useMutation({
    mutationFn: updatePrintingMachine,
    onSuccess: invalidate,
  });
}

export async function createPrintingMachine(input: {
  name: string;
  setupMinutes?: number;
  cooldownMinutes?: number;
  printSpeedM2PerHour?: number;
  dailyCapacityM2?: number;
}): Promise<PrintingMachine> {
  const response = await apiFetch<{ data: PrintingMachine }>(
    "/printing/machines",
    { method: "POST", body: JSON.stringify(input) },
  );
  return response.data;
}

export function useCreatePrintingMachine() {
  const invalidate = useInvalidateMachines();
  return useMutation({
    mutationFn: createPrintingMachine,
    onSuccess: invalidate,
  });
}

export async function deletePrintingMachine(machineId: string): Promise<void> {
  await apiFetch(`/printing/machines/${machineId}`, { method: "DELETE" });
}

export function useDeletePrintingMachine() {
  const invalidate = useInvalidateMachines();
  return useMutation({
    mutationFn: deletePrintingMachine,
    onSuccess: invalidate,
  });
}
