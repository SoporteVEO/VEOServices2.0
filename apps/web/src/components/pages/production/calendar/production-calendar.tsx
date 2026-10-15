"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { addDays } from "date-fns";
import { Palette, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  usePrintBacklog,
  usePrintJobs,
  usePrintingMachines,
} from "@/api/printing/printing.get";
import {
  useDeletePrintColorTest,
  useSchedulePrintJob,
  useUpdatePrintJob,
} from "@/api/printing/printing.mutations";
import type {
  PrintBacklogItem,
  PrintJob,
} from "@/api/printing/printing.types";
import type { GanttApi, GanttRangeInfo } from "@/components/reui/gantt";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { buildOptimisticPrintJob } from "./build-optimistic-print-job";
import { CreateColorTestDialog } from "./create-color-test-dialog";
import { PrintJobDialog } from "./print-job-dialog";
import { PrintingBacklogPanel } from "./printing-backlog-panel";
import { PrintingSettingsDialog } from "./printing-settings-dialog";
import {
  PrintingGantt,
  type BacklogDrag,
  type PrintJobDrop,
  type PrintJobReschedule,
} from "./printing-gantt";
import {
  COLOR_TEST_LABEL,
  COLOR_TEST_SWATCH,
  DAYS_VISIBLE,
  PHASE_LABELS,
  PHASE_SWATCHES,
  startOfCalendarWeek,
} from "./printing-calendar-utils";

/** Opening window; the gantt widens it as the operator scrolls. */
function initialRange() {
  const start = startOfCalendarWeek(new Date());
  return {
    from: start.toISOString(),
    to: addDays(start, DAYS_VISIBLE).toISOString(),
  };
}

export function ProductionCalendar() {
  const [range, setRange] = useState(initialRange);
  const [backlogSearch, setBacklogSearch] = useState("");
  const [backlogDrag, setBacklogDrag] = useState<{
    item: PrintBacklogItem;
    preview: BacklogDrag;
  } | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [colorTestOpen, setColorTestOpen] = useState(false);

  const ganttApi = useRef<GanttApi<PrintJob> | null>(null);

  const debouncedSearch = useDebouncedValue(backlogSearch.trim(), 300);
  // Scrolling grows the axis continuously; refetch only once it settles.
  const debouncedRange = useDebouncedValue(range, 250);

  const { data: machines, isLoading: machinesLoading } = usePrintingMachines();
  const { data: jobs, isLoading: jobsLoading } = usePrintJobs(
    debouncedRange.from,
    debouncedRange.to,
  );
  const { data: backlog, isLoading: backlogLoading } =
    usePrintBacklog(debouncedSearch);

  const schedule = useSchedulePrintJob();
  const update = useUpdatePrintJob();
  const deleteColorTest = useDeletePrintColorTest();

  const activeMachines = machines ?? [];

  const selectedJob = useMemo(
    () => jobs?.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  const handleRangeChange = useCallback((info: GanttRangeInfo) => {
    const from = info.range.start.toISOString();
    const to = info.range.end.toISOString();
    setRange((current) =>
      current.from === from && current.to === to ? current : { from, to },
    );
  }, []);

  const handleJobSelect = useCallback(
    (job: PrintJob) => setSelectedJobId(job.id),
    [],
  );

  const handleBacklogDragStart = useCallback((item: PrintBacklogItem) => {
    setBacklogDrag({
      item,
      preview: {
        label:
          item.kind === "COLOR_TEST"
            ? `Prueba · ${item.billboardCode ?? "Valla"}`
            : (item.billboardCode ?? "Valla"),
        areaM2: item.areaM2,
        fixedMinutes: item.kind === "COLOR_TEST" ? item.durationMinutes : null,
      },
    });
  }, []);

  async function handleDeleteColorTest(item: PrintBacklogItem) {
    try {
      await deleteColorTest.mutateAsync(item.id);
      toast.success("Prueba de color eliminada.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar la prueba de color.",
      );
    }
  }

  const handleBacklogDragEnd = useCallback(() => setBacklogDrag(null), []);

  async function handleBacklogDrop(drop: PrintJobDrop) {
    const current = backlogDrag;
    setBacklogDrag(null);
    if (!current) return;

    const machine = activeMachines.find(
      (candidate) => candidate.id === drop.machineId,
    );

    try {
      await schedule.mutateAsync({
        // No print time is sent: the server derives it from the target
        // machine's throughput, which is the only authority on duration.
        input: {
          ...(current.item.kind === "COLOR_TEST"
            ? { colorTestId: current.item.id }
            : { productionOrderItemId: current.item.id }),
          machineId: drop.machineId,
          scheduledStartAt: drop.startAt.toISOString(),
        },
        optimisticJob: machine
          ? buildOptimisticPrintJob(current.item, machine, drop.startAt)
          : undefined,
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo agendar el trabajo.",
      );
    }
  }

  async function handleReschedule({
    job,
    startAt,
    printMinutes,
  }: PrintJobReschedule) {
    try {
      await update.mutateAsync({
        jobId: job.id,
        scheduledStartAt: startAt.toISOString(),
        ...(printMinutes === undefined ? {} : { printMinutes }),
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo reprogramar el trabajo.",
      );
    }
  }

  async function handleMoveMachine(job: PrintJob, machineId: string) {
    try {
      await update.mutateAsync({ jobId: job.id, machineId });
      toast.success("Trabajo movido de máquina.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo mover el trabajo.",
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 @5xl/main:flex-row">
      <PrintingBacklogPanel
        items={backlog ?? []}
        isLoading={backlogLoading}
        search={backlogSearch}
        onSearchChange={setBacklogSearch}
        draggingItemId={backlogDrag?.item.id ?? null}
        onDragStart={handleBacklogDragStart}
        onDragEnd={handleBacklogDragEnd}
        onDeleteColorTest={handleDeleteColorTest}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <PrintingGantt
          machines={activeMachines}
          jobs={jobs ?? []}
          isLoading={machinesLoading || (jobsLoading && !jobs)}
          apiRef={ganttApi}
          backlogDrag={backlogDrag?.preview ?? null}
          toolbar={
            <>
              <PhaseLegend />
              <Button
                variant="outline"
                sizeVariant="sm"
                icon={Palette}
                onClick={() => setColorTestOpen(true)}
              >
                Prueba de color
              </Button>
              <Button
                variant="outline"
                sizeVariant="sm"
                icon={Settings2}
                onClick={() => setSettingsOpen(true)}
              >
                Configuración
              </Button>
            </>
          }
          onRangeChange={handleRangeChange}
          onJobSelect={handleJobSelect}
          onReschedule={handleReschedule}
          onMoveMachine={handleMoveMachine}
          onBacklogDrop={handleBacklogDrop}
          onBacklogDragEnd={handleBacklogDragEnd}
        />
      </div>

      <PrintJobDialog
        job={selectedJob}
        machines={activeMachines}
        jobs={jobs ?? []}
        open={selectedJob !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedJobId(null);
        }}
      />

      <PrintingSettingsDialog
        machines={activeMachines}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <CreateColorTestDialog
        open={colorTestOpen}
        onOpenChange={setColorTestOpen}
      />
    </div>
  );
}

function PhaseLegend() {
  return (
    <div className="hidden items-center gap-3 @xl/main:flex">
      {(Object.keys(PHASE_LABELS) as (keyof typeof PHASE_LABELS)[]).map(
        (phase) => (
          <span
            key={phase}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className={cn("size-2.5 rounded-sm", PHASE_SWATCHES[phase])}
              aria-hidden
            />
            {PHASE_LABELS[phase]}
          </span>
        ),
      )}
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn("size-2.5 rounded-sm", COLOR_TEST_SWATCH)}
          aria-hidden
        />
        {COLOR_TEST_LABEL}
      </span>
    </div>
  );
}
