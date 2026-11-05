import type { MentorshipStartOutcome } from '@prisma/client';
import type { MentorshipStatus } from './mentorship-quarter.js';

export interface DashboardRowInput {
  departmentId: string | null;
  departmentName: string;
  status: MentorshipStatus;
  startOutcome: MentorshipStartOutcome | null;
}

export interface MentorshipSummary {
  collaborators: number;
  done: number;
  pending: number;
  overdue: number;
  startEvaluated: number;
  startYes: number;
  startPartial: number;
  startNo: number;
  /** Share of evaluated Starts marked "Sí", 0-100; null when none was evaluated. */
  startCompliance: number | null;
  /** Share of collaborators with their session registered, 0-100. */
  completion: number | null;
}

function percentage(part: number, total: number): number | null {
  return total === 0 ? null : Math.round((part / total) * 1000) / 10;
}

export function summarize(rows: DashboardRowInput[]): MentorshipSummary {
  const count = (predicate: (row: DashboardRowInput) => boolean) =>
    rows.filter(predicate).length;
  const done = count((r) => r.status === 'DONE');
  const startYes = count((r) => r.startOutcome === 'YES');
  const startPartial = count((r) => r.startOutcome === 'PARTIAL');
  const startNo = count((r) => r.startOutcome === 'NO');
  const startEvaluated = startYes + startPartial + startNo;
  return {
    collaborators: rows.length,
    done,
    pending: count((r) => r.status === 'PENDING'),
    overdue: count((r) => r.status === 'OVERDUE'),
    startEvaluated,
    startYes,
    startPartial,
    startNo,
    startCompliance: percentage(startYes, startEvaluated),
    completion: percentage(done, rows.length),
  };
}

export function summarizeByDepartment(rows: DashboardRowInput[]) {
  const groups = new Map<
    string,
    { id: string | null; name: string; rows: DashboardRowInput[] }
  >();
  for (const row of rows) {
    const key = row.departmentId ?? '';
    const group = groups.get(key) ?? {
      id: row.departmentId,
      name: row.departmentName,
      rows: [],
    };
    group.rows.push(row);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      id: group.id,
      name: group.name,
      ...summarize(group.rows),
    }))
    .sort((a, b) => {
      if (a.id === null) return 1;
      if (b.id === null) return -1;
      return a.name.localeCompare(b.name, 'es');
    });
}
