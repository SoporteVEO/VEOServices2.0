import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { summarize, summarizeByDepartment } from './mentorship-dashboard.js';
import { toCollaboratorDto } from './mentorship.mapper.js';
import {
  businessToday,
  mentorshipStatus,
  parseQuarterKey,
  previousQuarter,
  quarterOf,
  quartersBetween,
  serializeQuarter,
  toIsoDay,
} from './mentorship-quarter.js';
import {
  joinedBeforeQuarterWhere,
  PLACEMENT_SELECT,
} from './mentorship.selects.js';
import { UNASSIGNED_DEPARTMENT } from './mentorships.constants.js';

const MIN_QUARTER_OPTIONS = 4;

@Injectable()
export class MentorshipsDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async quarterOptions(current: ReturnType<typeof quarterOf>) {
    const earliest = await this.prisma.mentorshipSession.findFirst({
      orderBy: { sessionDate: 'asc' },
      select: { sessionDate: true },
    });
    let from = current;
    for (let i = 1; i < MIN_QUARTER_OPTIONS; i++) from = previousQuarter(from);
    if (earliest) {
      const first = quarterOf(earliest.sessionDate);
      if (first.start.getTime() < from.start.getTime()) from = first;
    }
    return quartersBetween(from, current).map(serializeQuarter);
  }

  /**
   * Compliance per area for one quarter. It covers the active collaborators
   * that have a direct boss today.
   */
  async dashboard(quarterKey?: string) {
    const today = businessToday();
    const current = quarterOf(today);
    const quarter = quarterKey ? parseQuarterKey(quarterKey) : current;
    if (!quarter) throw new BadRequestException('Trimestre inválido');
    if (quarter.start.getTime() > current.start.getTime()) {
      throw new BadRequestException('El trimestre aún no ha iniciado');
    }

    const members = await this.prisma.teamMember.findMany({
      where: {
        status: 'ACTIVE',
        directBossId: { not: null },
        ...joinedBeforeQuarterWhere(quarter),
      },
      select: PLACEMENT_SELECT,
      orderBy: { fullName: 'asc' },
    });
    const sessions = await this.prisma.mentorshipSession.findMany({
      where: {
        quarter: quarter.key,
        collaboratorId: { in: members.map((m) => m.userId) },
      },
      select: {
        id: true,
        collaboratorId: true,
        sessionNumber: true,
        sessionDate: true,
        acknowledgedAt: true,
        previousStartOutcome: true,
      },
    });
    const sessionByUser = new Map(sessions.map((s) => [s.collaboratorId, s]));

    const collaborators = members.map((member) => {
      const session = sessionByUser.get(member.userId) ?? null;
      return {
        ...toCollaboratorDto(member),
        departmentId: member.department?.id ?? null,
        departmentName: member.department?.name ?? UNASSIGNED_DEPARTMENT,
        status: mentorshipStatus(!!session, quarter, today),
        startOutcome: session?.previousStartOutcome ?? null,
        session: session
          ? {
              id: session.id,
              sessionNumber: session.sessionNumber,
              sessionDate: toIsoDay(session.sessionDate),
              acknowledgedAt: session.acknowledgedAt?.toISOString() ?? null,
            }
          : null,
      };
    });

    return {
      quarter: serializeQuarter(quarter),
      quarters: await this.quarterOptions(current),
      totals: summarize(collaborators),
      departments: summarizeByDepartment(collaborators),
      collaborators,
    };
  }

  /** Every collaborator in Plantilla, archived ones included, with their history size. */
  async history() {
    const [members, counts] = await Promise.all([
      this.prisma.teamMember.findMany({
        select: PLACEMENT_SELECT,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.mentorshipSession.groupBy({
        by: ['collaboratorId'],
        _count: { _all: true },
        _max: { sessionDate: true },
      }),
    ]);
    const countByUser = new Map(counts.map((c) => [c.collaboratorId, c]));
    return members.map((member) => {
      const count = countByUser.get(member.userId);
      return {
        ...toCollaboratorDto(member),
        totalSessions: count?._count._all ?? 0,
        lastSessionDate: count?._max.sessionDate
          ? toIsoDay(count._max.sessionDate)
          : null,
      };
    });
  }
}
