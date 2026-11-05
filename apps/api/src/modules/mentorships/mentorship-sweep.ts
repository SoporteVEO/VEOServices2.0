import { mentorshipStatus, type QuarterInfo } from './mentorship-quarter.js';

export interface EligibleCollaborator {
  userId: string;
  name: string;
  departmentName: string;
  boss: { id: string; name: string; email: string };
}

export interface BossPendingGroup {
  boss: EligibleCollaborator['boss'];
  collaborators: EligibleCollaborator[];
}

export type QuarterNoticePhase = 'QUARTER_START' | 'OVERDUE';

export interface QuarterNoticePlan {
  phase: QuarterNoticePhase;
  groups: BossPendingGroup[];
}

/**
 * Groups the collaborators still missing their session by direct boss. Up to
 * the deadline the bosses get the quarter-start notice; after it the same
 * list is overdue.
 */
export function planQuarterNotices(
  eligible: EligibleCollaborator[],
  doneUserIds: Set<string>,
  quarter: QuarterInfo,
  today: Date,
): QuarterNoticePlan {
  const groups = new Map<string, BossPendingGroup>();
  for (const collaborator of eligible) {
    if (doneUserIds.has(collaborator.userId)) continue;
    const group = groups.get(collaborator.boss.id) ?? {
      boss: collaborator.boss,
      collaborators: [],
    };
    group.collaborators.push(collaborator);
    groups.set(collaborator.boss.id, group);
  }
  const phase =
    mentorshipStatus(false, quarter, today) === 'OVERDUE'
      ? 'OVERDUE'
      : 'QUARTER_START';
  return { phase, groups: [...groups.values()] };
}

export function overdueByDepartment(
  eligible: EligibleCollaborator[],
  doneUserIds: Set<string>,
) {
  const byName = new Map<
    string,
    { name: string; overdue: number; total: number }
  >();
  for (const collaborator of eligible) {
    const entry = byName.get(collaborator.departmentName) ?? {
      name: collaborator.departmentName,
      overdue: 0,
      total: 0,
    };
    entry.total += 1;
    if (!doneUserIds.has(collaborator.userId)) entry.overdue += 1;
    byName.set(collaborator.departmentName, entry);
  }
  return [...byName.values()]
    .filter((d) => d.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue || a.name.localeCompare(b.name));
}

export const noticeKeys = {
  quarterStart: (quarter: string, bossId: string) =>
    `quarter-start:${quarter}:${bossId}`,
  bossOverdue: (quarter: string, bossId: string) =>
    `overdue:${quarter}:${bossId}`,
  hrOverdue: (quarter: string) => `overdue-hr:${quarter}`,
  followUp: (sessionId: string, day: string) => `follow-up:${sessionId}:${day}`,
};
