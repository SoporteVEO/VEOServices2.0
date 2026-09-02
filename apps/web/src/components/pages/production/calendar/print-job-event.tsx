"use client";

import type { PrintJob } from "@/api/printing/printing.types";
import { cn } from "@/lib/utils";
import {
  PHASE_FILLS,
  formatClock,
  formatMinutes,
  jobSegments,
  jobTitle,
} from "./printing-calendar-utils";

/**
 * ReUI paints a bar as one block with a progress fill, but a print job is three
 * phases back to back, so the fill is replaced with proportional segments.
 * A container query drops the label on bars too narrow to hold it, which keeps
 * the decision with CSS as the timeline zooms.
 */
export function PrintJobEvent({
  job,
  isDragging,
  isSelected,
}: {
  job: PrintJob;
  isDragging: boolean;
  isSelected: boolean;
}) {
  const segments = jobSegments(job);

  return (
    <div
      className={cn(
        "@container relative flex h-full w-full overflow-hidden rounded-md border border-black/10 shadow-sm",
        job.status === "CANCELLED" && "opacity-45 saturate-0",
        job.status === "COMPLETED" && "ring-1 ring-emerald-500/60",
        isSelected && "ring-2 ring-primary",
        isDragging && "opacity-70",
      )}
    >
      {segments.map((segment) => (
        <span
          key={segment.phase}
          className={cn("h-full", PHASE_FILLS[segment.phase])}
          style={{
            width: `${(segment.minutes / job.plannedTotalMinutes) * 100}%`,
          }}
        />
      ))}

      <span className="pointer-events-none absolute inset-0 hidden items-center px-2 @min-[56px]:flex">
        <span className="truncate text-[11px] font-semibold text-white drop-shadow-sm">
          {jobTitle(job)}
        </span>
      </span>
    </div>
  );
}

/** Detail shown in the cursor-following preview while a bar is dragged. */
export function PrintJobDragPreview({
  job,
  start,
  end,
  valid,
}: {
  job: PrintJob;
  start: Date;
  end: Date;
  valid: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-md border bg-popover px-2 py-1.5 text-popover-foreground shadow-md",
        !valid && "border-destructive text-destructive",
      )}
    >
      <span className="text-xs font-semibold">{jobTitle(job)}</span>
      <span className="text-[11px] tabular-nums opacity-80">
        {formatClock(start)} – {formatClock(end)} (
        {formatMinutes(job.plannedTotalMinutes)})
      </span>
      {!valid ? (
        <span className="text-[11px] font-medium">
          La máquina ya tiene un trabajo a esa hora
        </span>
      ) : null}
    </div>
  );
}
