"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type RefObject,
} from "react";
import { es } from "date-fns/locale";
import {
  computeJobMinutes,
  dailyCapacityFor,
} from "@/api/printing/printing.print-time";
import type { PrintJob, PrintingMachine } from "@/api/printing/printing.types";
import { Skeleton } from "@/components/primitives/ui/skeleton";
import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/primitives/ui/context-menu";
import {
  Gantt,
  GanttNav,
  GanttNavNext,
  GanttNavPrev,
  GanttNavToday,
  GanttTitle,
  GanttView,
  type GanttApi,
  type GanttEvent,
  type GanttProposedUpdate,
  type GanttRangeInfo,
  type GanttResource,
} from "@/components/reui/gantt";
import { cn } from "@/lib/utils";
import { PrintJobDragPreview, PrintJobEvent } from "./print-job-event";
import {
  MINUTE_MS,
  SNAP_MINUTES,
  formatArea,
  formatClock,
  formatMinutes,
  isJobLocked,
  jobSegments,
  jobTitle,
} from "./printing-calendar-utils";
import {
  readGanttSurface,
  resolveSurfaceTarget,
  surfaceGhostBox,
  type GanttSurface,
} from "./printing-gantt-surface";

/** Hour columns on the day scale; the only scale that snaps below a day. */
const HOUR_INTERVAL = 60;

export type PrintJobDrop = {
  machineId: string;
  startAt: Date;
};

/**
 * A backlog card mid-flight. Only the panel's area travels with it: how long
 * it takes is a property of whichever press it ends up over, so the duration
 * is resolved during the drag rather than baked in here.
 */
export type BacklogDrag = {
  label: string;
  areaM2: number;
};

/** Where a dragged backlog card would land, and whether the day allows it. */
type Ghost = {
  box: { left: number; top: number; width: number; height: number };
  startAt: Date;
  machineId: string;
  printMinutes: number;
  remainingM2: number;
  fits: boolean;
};

export type PrintJobReschedule = {
  job: PrintJob;
  startAt: Date;
  /** Set when a resize changed the span; the print phase absorbs the delta. */
  printMinutes?: number;
};

type Props = {
  machines: PrintingMachine[];
  jobs: PrintJob[];
  isLoading: boolean;
  apiRef: RefObject<GanttApi<PrintJob> | null>;
  /** Non-null while a backlog card is being dragged over the chart. */
  backlogDrag: BacklogDrag | null;
  toolbar?: React.ReactNode;
  onRangeChange: (info: GanttRangeInfo) => void;
  onJobSelect: (job: PrintJob) => void;
  onReschedule: (change: PrintJobReschedule) => void;
  onMoveMachine: (job: PrintJob, machineId: string) => void;
  onBacklogDrop: (drop: PrintJobDrop) => void;
  onBacklogDragEnd: () => void;
};

export function PrintingGantt({
  machines,
  jobs,
  isLoading,
  apiRef,
  backlogDrag,
  toolbar,
  onRangeChange,
  onJobSelect,
  onReschedule,
  onMoveMachine,
  onBacklogDrop,
  onBacklogDragEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<GanttSurface | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);

  // A fresh backlog drag must not inherit the previous landing spot.
  const [lastBacklogDrag, setLastBacklogDrag] = useState(backlogDrag);
  if (backlogDrag !== lastBacklogDrag) {
    setLastBacklogDrag(backlogDrag);
    setGhost(null);
  }

  const resources = useMemo<GanttResource[]>(
    () =>
      machines.map((machine) => ({
        id: machine.id,
        title: machine.name,
        // One print at a time per machine, mirroring the server's rule.
        scheduleMode: "single",
      })),
    [machines],
  );

  const events = useMemo<GanttEvent<PrintJob>[]>(
    () =>
      jobs.map((job) => ({
        id: job.id,
        title: jobTitle(job),
        start: new Date(job.scheduledStartAt),
        end: new Date(job.scheduledEndAt),
        resourceId: job.machineId,
        readOnly: isJobLocked(job.status),
        data: job,
      })),
    [jobs],
  );

  const handleEventUpdate = useCallback(
    (update: GanttProposedUpdate<PrintJob>) => {
      const job = update.event.data;
      if (!job) return false;

      if (update.source === "resize-end" || update.source === "resize-start") {
        const totalMinutes = Math.round(
          (update.end.getTime() - update.start.getTime()) / MINUTE_MS,
        );
        const printMinutes =
          totalMinutes - job.setupMinutes - job.cooldownMinutes;
        if (printMinutes < 1) return false;
        onReschedule({ job, startAt: update.start, printMinutes });
        return true;
      }

      onReschedule({ job, startAt: update.start });
      return true;
    },
    [onReschedule],
  );

  /** Reads live geometry so the ghost matches where the drop will land. */
  function trackBacklogDrag(event: DragEvent<HTMLDivElement>) {
    if (!backlogDrag) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    const surface = readGanttSurface(containerRef.current);
    surfaceRef.current = surface;
    if (!surface) return;

    const target = resolveSurfaceTarget(surface, event.clientX, event.clientY);
    if (!target) {
      setGhost(null);
      return;
    }

    const machine = machines.find(
      (candidate) => candidate.id === target.machineId,
    );
    if (!machine) {
      setGhost(null);
      return;
    }

    const phases = computeJobMinutes(backlogDrag.areaM2, machine);
    const totalMinutes =
      phases.setupMinutes + phases.printMinutes + phases.cooldownMinutes;
    const box = surfaceGhostBox(surface, target, totalMinutes);
    if (!box) {
      setGhost(null);
      return;
    }

    const capacity = dailyCapacityFor(machine, jobs, target.startAt);
    const fits = backlogDrag.areaM2 <= capacity.remainingM2 + 0.01;

    // Snapping means this only changes on 15-minute boundaries.
    setGhost((current) =>
      current &&
      current.machineId === target.machineId &&
      current.startAt.getTime() === target.startAt.getTime()
        ? current
        : {
            box,
            startAt: target.startAt,
            machineId: target.machineId,
            printMinutes: phases.printMinutes,
            remainingM2: capacity.remainingM2,
            fits,
          },
    );
  }

  function handleBacklogDrop(event: DragEvent<HTMLDivElement>) {
    if (!backlogDrag) return;
    event.preventDefault();

    const surface = readGanttSurface(containerRef.current);
    const target = surface
      ? resolveSurfaceTarget(surface, event.clientX, event.clientY)
      : null;
    setGhost(null);

    if (!target) {
      onBacklogDragEnd();
      return;
    }
    onBacklogDrop({ machineId: target.machineId, startAt: target.startAt });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onDragOver={trackBacklogDrag}
      onDrop={handleBacklogDrop}
      onDragLeave={() => setGhost(null)}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card",
        backlogDrag && "ring-2 ring-primary/40",
      )}
    >
      <Gantt<PrintJob>
        apiRef={apiRef}
        events={events}
        resources={resources}
        defaultScale="day"
        interval={HOUR_INTERVAL}
        snapDuration={SNAP_MINUTES}
        slotDuration={SNAP_MINUTES}
        locale={es}
        weekStartsOn={1}
        scheduleMode="single"
        overlap="reject"
        initialCenter="now"
        nowIndicator
        offDays
        offscreenIndicators
        infiniteScroll
        barLabel="inside"
        summaryBars={false}
        baselineBars={false}
        dependencyLines={false}
        rowCheckboxes={false}
        scrollbars="native"
        treePanel={{ width: 208, nameColumnWidth: 208 }}
        // Taller lanes so a bar can show three phase segments and the machine
        // row can carry its default times under the name.
        metrics={{ laneHeight: 2.25, ghostHeight: 2.25 }}
        onRangeChange={onRangeChange}
        onEventUpdate={handleEventUpdate}
        onEventClick={(occurrence) => {
          const job = occurrence.event.data;
          if (job) onJobSelect(job);
        }}
        renderResourceLabel={({ resource }) => (
          <MachineLabel
            machine={machines.find(
              (candidate) => candidate.id === resource.id,
            )}
          />
        )}
        renderEvent={({ occurrence, isDragging, isSelected }) => {
          const job = occurrence.event.data;
          if (!job) return null;
          return (
            <PrintJobEvent
              job={job}
              isDragging={isDragging}
              isSelected={isSelected}
            />
          );
        }}
        renderDragPreview={({ occurrence, start, end, valid }) => {
          const job = occurrence.event.data;
          if (!job) return null;
          return (
            <PrintJobDragPreview
              job={job}
              start={start}
              end={end}
              valid={valid}
            />
          );
        }}
        renderEventMenu={({ occurrence }) => {
          const job = occurrence.event.data;
          if (!job) return null;
          return (
            <PrintJobMenu
              job={job}
              machines={machines}
              onSelect={onJobSelect}
              onMoveMachine={onMoveMachine}
            />
          );
        }}
        className="min-h-0 flex-1"
      >
        <GanttNav>
          <GanttNavToday />
          <GanttNavPrev />
          <GanttNavNext />
          <GanttTitle />
          <div className="ms-auto flex items-center gap-2">{toolbar}</div>
        </GanttNav>
        <GanttView />
      </Gantt>

      {ghost && backlogDrag ? (
        <div
          className={cn(
            "pointer-events-none fixed z-50 flex flex-col justify-center overflow-hidden rounded-md border-2 border-dashed px-2",
            ghost.fits
              ? "border-primary bg-primary/15"
              : "border-destructive bg-destructive/15",
          )}
          style={ghost.box}
        >
          <span
            className={cn(
              "truncate text-[11px] font-semibold",
              ghost.fits ? "text-primary" : "text-destructive",
            )}
          >
            {formatClock(ghost.startAt)} · {backlogDrag.label} ·{" "}
            {formatMinutes(ghost.printMinutes)}
          </span>
          <span
            className={cn(
              "truncate text-[10px]",
              ghost.fits ? "text-primary/80" : "text-destructive",
            )}
          >
            {ghost.fits
              ? `Quedan ${formatArea(ghost.remainingM2)} m² ese día`
              : `Excede la capacidad: quedan ${formatArea(ghost.remainingM2)} m²`}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function MachineLabel({ machine }: { machine: PrintingMachine | undefined }) {
  if (!machine) return null;
  return (
    <span className="flex min-w-0 flex-col">
      <span
        className={cn(
          "truncate text-sm font-semibold",
          !machine.isActive && "text-muted-foreground line-through",
        )}
      >
        {machine.name}
      </span>
      <span className="truncate text-[11px] text-muted-foreground">
        {formatArea(machine.printSpeedM2PerHour)} m²/h ·{" "}
        {formatArea(machine.dailyCapacityM2)} m²/día
      </span>
    </span>
  );
}

/**
 * ReUI moves a bar only along its own row, so switching machines lives here
 * rather than in the drag gesture.
 */
function PrintJobMenu({
  job,
  machines,
  onSelect,
  onMoveMachine,
}: {
  job: PrintJob;
  machines: PrintingMachine[];
  onSelect: (job: PrintJob) => void;
  onMoveMachine: (job: PrintJob, machineId: string) => void;
}) {
  const locked = isJobLocked(job.status);
  const others = machines.filter((machine) => machine.id !== job.machineId);
  const segments = jobSegments(job);

  return (
    <>
      <ContextMenuLabel className="flex flex-col gap-0.5">
        <span className="font-semibold">{jobTitle(job)}</span>
        <span className="text-[11px] font-normal text-muted-foreground">
          {segments
            .map((segment) => formatMinutes(segment.minutes))
            .join(" · ")}
        </span>
      </ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onSelect(job)}>
        Ver detalle
      </ContextMenuItem>
      {!locked && others.length > 0 ? (
        <>
          <ContextMenuSeparator />
          <ContextMenuLabel className="text-[11px] font-normal text-muted-foreground">
            Mover a
          </ContextMenuLabel>
          {others.map((machine) => (
            <ContextMenuItem
              key={machine.id}
              onClick={() => onMoveMachine(job, machine.id)}
            >
              {machine.name}
            </ContextMenuItem>
          ))}
        </>
      ) : null}
    </>
  );
}
