import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  buildBossOverdueEmail,
  buildFollowUpEmail,
  buildHrOverdueEmail,
  buildQuarterStartEmail,
  formatEmailDay,
} from './mentorship-emails.js';
import { personName } from './mentorship.mapper.js';
import { joinedBeforeQuarterWhere } from './mentorship.selects.js';
import { MentorshipNotifier } from './mentorship-notifier.js';
import {
  addDays,
  businessToday,
  quarterOf,
  toIsoDay,
  type QuarterInfo,
} from './mentorship-quarter.js';
import {
  type EligibleCollaborator,
  noticeKeys,
  overdueByDepartment,
  planQuarterNotices,
} from './mentorship-sweep.js';
import {
  FOLLOW_UP_REMINDER_DAYS,
  MENTORSHIPS_PATH,
  mentorshipSessionHref,
  SWEEP_THROTTLE_MS,
  UNASSIGNED_DEPARTMENT,
} from './mentorships.constants.js';

export interface SweepSummary {
  quarter: string;
  quarterStartNotices: number;
  overdueNotices: number;
  hrOverdueNotice: boolean;
  followUpReminders: number;
}

/**
 * Sends the time-based mentorship notices. Every notice claims a unique key
 * first, so running the sweep again (cron, another instance, a page load)
 * never repeats one.
 */
@Injectable()
export class MentorshipSweepService {
  private readonly logger = new Logger(MentorshipSweepService.name);
  private lastRunAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: MentorshipNotifier,
  ) {}

  async runIfStale() {
    if (Date.now() - this.lastRunAt < SWEEP_THROTTLE_MS) return;
    this.lastRunAt = Date.now();
    try {
      await this.run();
    } catch (error) {
      this.logger.error('Mentorship sweep failed', error);
    }
  }

  async run(now: Date = new Date()): Promise<SweepSummary> {
    const today = businessToday(now);
    const quarter = quarterOf(today);
    const eligible = await this.loadEligible(quarter);
    const done = await this.prisma.mentorshipSession.findMany({
      where: {
        quarter: quarter.key,
        collaboratorId: { in: eligible.map((c) => c.userId) },
      },
      select: { collaboratorId: true },
    });
    const doneUserIds = new Set(done.map((s) => s.collaboratorId));

    const summary: SweepSummary = {
      quarter: quarter.key,
      quarterStartNotices: 0,
      overdueNotices: 0,
      hrOverdueNotice: false,
      followUpReminders: 0,
    };

    const plan = planQuarterNotices(eligible, doneUserIds, quarter, today);
    for (const group of plan.groups) {
      const names = group.collaborators.map((c) => c.name);
      if (plan.phase === 'QUARTER_START') {
        if (
          await this.claim(noticeKeys.quarterStart(quarter.key, group.boss.id))
        ) {
          await this.sendQuarterStart(group.boss, names, quarter);
          summary.quarterStartNotices += 1;
        }
      } else if (
        await this.claim(noticeKeys.bossOverdue(quarter.key, group.boss.id))
      ) {
        await this.sendBossOverdue(group.boss, names, quarter);
        summary.overdueNotices += 1;
      }
    }

    if (
      plan.phase === 'OVERDUE' &&
      plan.groups.length > 0 &&
      (await this.claim(noticeKeys.hrOverdue(quarter.key)))
    ) {
      await this.sendHrOverdue(eligible, doneUserIds, quarter);
      summary.hrOverdueNotice = true;
    }

    summary.followUpReminders = await this.sendFollowUpReminders(today);
    return summary;
  }

  private async loadEligible(
    quarter: QuarterInfo,
  ): Promise<EligibleCollaborator[]> {
    const members = await this.prisma.teamMember.findMany({
      where: {
        status: 'ACTIVE',
        user: { disabled: false },
        directBoss: { disabled: false },
        ...joinedBeforeQuarterWhere(quarter),
      },
      select: {
        userId: true,
        fullName: true,
        department: { select: { name: true } },
        directBoss: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teamMember: { select: { fullName: true, businessEmail: true } },
          },
        },
      },
    });
    return members.flatMap((member) => {
      const boss = member.directBoss;
      if (!boss) return [];
      return [
        {
          userId: member.userId,
          name: member.fullName,
          departmentName: member.department?.name ?? UNASSIGNED_DEPARTMENT,
          boss: {
            id: boss.id,
            name: boss.teamMember?.fullName || personName(boss),
            email: boss.teamMember?.businessEmail || boss.email,
          },
        },
      ];
    });
  }

  private async claim(key: string): Promise<boolean> {
    try {
      await this.prisma.mentorshipNotice.create({ data: { key } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  private async sendQuarterStart(
    boss: EligibleCollaborator['boss'],
    names: string[],
    quarter: QuarterInfo,
  ) {
    const deadline = formatEmailDay(quarter.deadline);
    const count =
      names.length === 1
        ? '1 colaborador con mentoría pendiente'
        : `${names.length} colaboradores con mentoría pendiente`;
    await this.notifier.inApp(
      [boss.id],
      `Tienes ${count}; fecha límite: ${deadline}.`,
      MENTORSHIPS_PATH,
      'HIGH',
    );
    await this.notifier.sendEmail(
      boss.email,
      buildQuarterStartEmail({
        bossName: boss.name,
        quarterLabel: quarter.label,
        deadline: quarter.deadline,
        collaborators: names,
        url: this.notifier.url(MENTORSHIPS_PATH),
      }),
    );
  }

  private async sendBossOverdue(
    boss: EligibleCollaborator['boss'],
    names: string[],
    quarter: QuarterInfo,
  ) {
    await this.notifier.inApp(
      [boss.id],
      `${names.length === 1 ? '1 mentoría venció' : `${names.length} mentorías vencieron`} sin registrarse (${quarter.label}).`,
      MENTORSHIPS_PATH,
      'HIGH',
    );
    await this.notifier.sendEmail(
      boss.email,
      buildBossOverdueEmail({
        bossName: boss.name,
        quarterLabel: quarter.label,
        deadline: quarter.deadline,
        collaborators: names,
        url: this.notifier.url(MENTORSHIPS_PATH),
      }),
    );
  }

  private async sendHrOverdue(
    eligible: EligibleCollaborator[],
    doneUserIds: Set<string>,
    quarter: QuarterInfo,
  ) {
    const byDepartment = overdueByDepartment(eligible, doneUserIds);
    const total = byDepartment.reduce((sum, d) => sum + d.overdue, 0);
    const href = `${MENTORSHIPS_PATH}?tab=panel`;
    const hr = await this.notifier.hrRecipients();
    await this.notifier.inApp(
      hr.map((r) => r.userId),
      `${total} mentorías del ${quarter.label} vencieron sin registrarse.`,
      href,
      'HIGH',
    );
    const email = buildHrOverdueEmail({
      quarterLabel: quarter.label,
      deadline: quarter.deadline,
      byDepartment,
      url: this.notifier.url(href),
    });
    for (const recipient of hr) {
      await this.notifier.sendEmail(recipient.email, email);
    }
  }

  private async sendFollowUpReminders(today: Date): Promise<number> {
    const sessions = await this.prisma.mentorshipSession.findMany({
      where: {
        nextFollowUpDate: {
          gte: today,
          lte: addDays(today, FOLLOW_UP_REMINDER_DAYS),
        },
        collaborator: {
          disabled: false,
          teamMember: { status: 'ACTIVE' },
        },
      },
      select: {
        id: true,
        collaboratorId: true,
        collaboratorName: true,
        mentorId: true,
        nextFollowUpDate: true,
        startWhat: true,
        commitment: true,
        collaborator: {
          select: { teamMember: { select: { directBossId: true } } },
        },
      },
    });

    let sent = 0;
    for (const session of sessions) {
      const day = toIsoDay(session.nextFollowUpDate);
      if (!(await this.claim(noticeKeys.followUp(session.id, day)))) continue;

      const bossId =
        session.collaborator.teamMember?.directBossId ?? session.mentorId;
      const href = mentorshipSessionHref(session.id);
      const date = formatEmailDay(session.nextFollowUpDate);
      const recipients = await Promise.all(
        [session.collaboratorId, bossId]
          .filter((id): id is string => !!id)
          .map((id) => this.notifier.recipient(id)),
      );

      for (const recipient of recipients) {
        if (!recipient) continue;
        const isCollaborator = recipient.userId === session.collaboratorId;
        await this.notifier.inApp(
          [recipient.userId],
          isCollaborator
            ? `El ${date} es el seguimiento de tu mentoría.`
            : `El ${date} es el seguimiento de la mentoría de ${session.collaboratorName}.`,
          href,
        );
        await this.notifier.sendEmail(
          recipient.email,
          buildFollowUpEmail({
            recipientName: recipient.name,
            collaboratorName: session.collaboratorName,
            isCollaborator,
            startWhat: session.startWhat,
            commitment: session.commitment,
            followUpDate: session.nextFollowUpDate,
            url: this.notifier.url(href),
          }),
        );
      }
      sent += 1;
    }
    return sent;
  }
}
