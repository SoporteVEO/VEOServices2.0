/**
 * Geometry for dropping a backlog card onto the gantt.
 *
 * The gantt's own pointer engine only moves bars that already exist, so
 * scheduling a new one from the backlog panel is an ordinary HTML5 drag. It is
 * measured off the same `data-gantt-*` attributes the engine reads, which is
 * what keeps a drop landing on exactly the slot the ghost promised.
 */

const MINUTE_MS = 60 * 1000;

type SurfaceRow = { machineId: string; rect: DOMRect };

export type GanttSurface = {
  /** The axis spans the whole range, so it is wider than its viewport. */
  rect: DOMRect;
  /** Visible clip of the timeline, used to keep the ghost inside the pane. */
  viewportRect: DOMRect | null;
  rangeStart: number;
  rangeEnd: number;
  snapMinutes: number;
  isRtl: boolean;
  rows: SurfaceRow[];
};

export type SurfaceTarget = {
  machineId: string;
  startAt: Date;
  row: SurfaceRow;
};

export function readGanttSurface(root: HTMLElement | null): GanttSurface | null {
  if (!root) return null;
  const axis = root.querySelector<HTMLElement>("[data-gantt-axis]");
  if (!axis) return null;

  const rangeStart = Number(axis.dataset.ganttRangeStart);
  const rangeEnd = Number(axis.dataset.ganttRangeEnd);
  if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd)) return null;

  const pane = root.querySelector<HTMLElement>(
    "[data-slot=gantt-timeline-pane]",
  );

  return {
    rect: axis.getBoundingClientRect(),
    viewportRect: pane?.getBoundingClientRect() ?? null,
    rangeStart,
    rangeEnd,
    snapMinutes: Number(axis.dataset.ganttSnap) || 15,
    isRtl: getComputedStyle(axis).direction === "rtl",
    rows: [...root.querySelectorAll<HTMLElement>("[data-gantt-row]")]
      // Parent rows aggregate their subtree and take no drops.
      .filter((row) => row.dataset.ganttRowStatic === undefined)
      .map((row) => ({
        machineId: row.dataset.ganttResource ?? "",
        rect: row.getBoundingClientRect(),
      })),
  };
}

function rangeMinutes(surface: GanttSurface): number {
  return (surface.rangeEnd - surface.rangeStart) / MINUTE_MS;
}

/** Pointer x to minutes from the range start, mirrored under RTL. */
function minutesAt(surface: GanttSurface, clientX: number): number {
  const clamped = Math.min(
    Math.max(clientX, surface.rect.left),
    surface.rect.right,
  );
  const traveled = surface.isRtl
    ? surface.rect.right - clamped
    : clamped - surface.rect.left;
  return (traveled / surface.rect.width) * rangeMinutes(surface);
}

export function resolveSurfaceTarget(
  surface: GanttSurface,
  clientX: number,
  clientY: number,
): SurfaceTarget | null {
  const row = surface.rows.find(
    (candidate) =>
      clientY >= candidate.rect.top && clientY <= candidate.rect.bottom,
  );
  if (!row || !row.machineId) return null;

  const snapped =
    Math.round(minutesAt(surface, clientX) / surface.snapMinutes) *
    surface.snapMinutes;

  return {
    machineId: row.machineId,
    startAt: new Date(surface.rangeStart + Math.max(snapped, 0) * MINUTE_MS),
    row,
  };
}

/**
 * Viewport box for the drop ghost, clipped to the visible timeline so it never
 * bleeds over the task tree or outside the pane.
 */
export function surfaceGhostBox(
  surface: GanttSurface,
  target: SurfaceTarget,
  totalMinutes: number,
): { left: number; top: number; width: number; height: number } | null {
  const pxPerMinute = surface.rect.width / rangeMinutes(surface);
  const offsetMinutes =
    (target.startAt.getTime() - surface.rangeStart) / MINUTE_MS;
  const rawWidth = Math.max(totalMinutes * pxPerMinute, 4);
  const rawLeft = surface.isRtl
    ? surface.rect.right - offsetMinutes * pxPerMinute - rawWidth
    : surface.rect.left + offsetMinutes * pxPerMinute;

  const clipLeft = surface.viewportRect?.left ?? surface.rect.left;
  const clipRight = surface.viewportRect?.right ?? surface.rect.right;
  const left = Math.max(rawLeft, clipLeft);
  const right = Math.min(rawLeft + rawWidth, clipRight);
  if (right <= left) return null;

  return {
    left,
    top: target.row.rect.top + 4,
    width: right - left,
    height: Math.max(target.row.rect.height - 8, 12),
  };
}
