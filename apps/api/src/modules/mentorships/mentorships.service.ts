import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AcknowledgeMentorshipSessionDto,
  CreateMentorshipSessionDto,
  KssItemDto,
  UpdateMentorshipSessionDto,
} from './dto/mentorship.dto.js';
import {
  canAcknowledgeSession,
  canEditSession,
  canRegisterSession,
  canViewCollaborator,
  type MentorshipViewer,
} from './mentorship-access.js';
import { buildSessionRegisteredEmail } from './mentorship-emails.js';
import {
  personName,
  toCollaboratorDto,
  toRevisionDtos,
  toSessionDto,
} from './mentorship.mapper.js';
import { MentorshipNotifier } from './mentorship-notifier.js';
import {
  businessToday,
  joinedBeforeQuarter,
  mentorshipStatus,
  parseIsoDay,
  parseQuarterKey,
  quarterOf,
  serializeQuarter,
  toIsoDay,
  type QuarterInfo,
} from './mentorship-quarter.js';
import {
  diffSession,
  type EditableSessionValues,
} from './mentorship-revisions.js';
import {
  joinedBeforeQuarterWhere,
  KSS_TEXT_FIELDS,
  PLACEMENT_SELECT,
  type PlacementRow,
  SESSION_DETAIL_SELECT,
  SESSION_SELECT,
  type SessionRow,
} from './mentorship.selects.js';
import { MentorshipSweepService } from './mentorship-sweep.service.js';
import { mentorshipSessionHref } from './mentorships.constants.js';

type KssPrefix = 'keep' | 'stop' | 'start';

function flattenKss(prefix: KssPrefix, item: KssItemDto) {
  return {
    [`${prefix}What`]: item.what.trim(),
    [`${prefix}How`]: item.how.trim(),
    [`${prefix}When`]: item.when.trim(),
    [`${prefix}Indicator`]: item.indicator.trim(),
  } as Record<(typeof KSS_TEXT_FIELDS)[number], string>;
}

function requireDay(value: string, message: string): Date {
  const day = parseIsoDay(value);
  if (!day) throw new BadRequestException(message);
  return day;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function editableValues(session: SessionRow): EditableSessionValues {
  const values = {
    sessionDate: session.sessionDate,
    nextFollowUpDate: session.nextFollowUpDate,
    previousStartOutcome: session.previousStartOutcome,
    previousStartEvidence: session.previousStartEvidence,
    commitment: session.commitment,
  } as EditableSessionValues;
  for (const field of KSS_TEXT_FIELDS) values[field] = session[field];
  return values;
}

@Injectable()
export class MentorshipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: MentorshipNotifier,
    private readonly sweep: MentorshipSweepService,
  ) {}

  private loadPlacement(userId: string): Promise<PlacementRow | null> {
    return this.prisma.teamMember.findUnique({
      where: { userId },
      select: PLACEMENT_SELECT,
    });
  }

  private async actorName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        teamMember: { select: { fullName: true } },
      },
    });
    return user.teamMember?.fullName || personName(user);
  }

  private resolveQuarter(key: string | undefined, today: Date): QuarterInfo {
    const current = quarterOf(today);
    if (!key) return current;
    const quarter = parseQuarterKey(key);
    if (!quarter) throw new BadRequestException('Trimestre inválido');
    if (quarter.start.getTime() > current.start.getTime()) {
      throw new BadRequestException('El trimestre aún no ha iniciado');
    }
    return quarter;
  }

  async overview(viewer: MentorshipViewer) {
    await this.sweep.runIfStale();
    const today = businessToday();
    const [teamCount, pendingAcknowledgements] = await Promise.all([
      this.prisma.teamMember.count({
        where: {
          directBossId: viewer.id,
          status: 'ACTIVE',
          ...joinedBeforeQuarterWhere(quarterOf(today)),
        },
      }),
      this.prisma.mentorshipSession.count({
        where: { collaboratorId: viewer.id, acknowledgedAt: null },
      }),
    ]);
    return {
      isHr: viewer.isHr,
      teamCount,
      pendingAcknowledgements,
      quarter: serializeQuarter(quarterOf(today)),
      today: toIsoDay(today),
    };
  }

  async team(viewer: MentorshipViewer, quarterKey?: string) {
    const today = businessToday();
    const quarter = this.resolveQuarter(quarterKey, today);
    const members = await this.prisma.teamMember.findMany({
      where: {
        directBossId: viewer.id,
        status: 'ACTIVE',
        ...joinedBeforeQuarterWhere(quarter),
      },
      select: PLACEMENT_SELECT,
      orderBy: { fullName: 'asc' },
    });
    const sessions = await this.prisma.mentorshipSession.findMany({
      where: { collaboratorId: { in: members.map((m) => m.userId) } },
      orderBy: { sessionNumber: 'desc' },
      select: {
        id: true,
        collaboratorId: true,
        sessionNumber: true,
        quarter: true,
        sessionDate: true,
        nextFollowUpDate: true,
        startWhat: true,
        acknowledgedAt: true,
      },
    });

    const toBrief = (session: (typeof sessions)[number]) => ({
      id: session.id,
      sessionNumber: session.sessionNumber,
      sessionDate: toIsoDay(session.sessionDate),
      nextFollowUpDate: toIsoDay(session.nextFollowUpDate),
      startWhat: session.startWhat,
      acknowledgedAt: session.acknowledgedAt?.toISOString() ?? null,
    });

    return {
      quarter: serializeQuarter(quarter),
      members: members.map((member) => {
        const own = sessions.filter((s) => s.collaboratorId === member.userId);
        const inQuarter = own.find((s) => s.quarter === quarter.key);
        return {
          ...toCollaboratorDto(member),
          quarterStatus: mentorshipStatus(!!inQuarter, quarter, today),
          quarterSession: inQuarter ? toBrief(inQuarter) : null,
          lastSession: own[0] ? toBrief(own[0]) : null,
          totalSessions: own.length,
        };
      }),
    };
  }

  async mine(viewer: MentorshipViewer) {
    const rows = await this.prisma.mentorshipSession.findMany({
      where: { collaboratorId: viewer.id },
      orderBy: { sessionNumber: 'desc' },
      select: SESSION_SELECT,
    });
    return rows.map(toSessionDto);
  }

  async collaboratorProfile(viewer: MentorshipViewer, userId: string) {
    const placement = await this.loadPlacement(userId);
    if (!canViewCollaborator(viewer, placement)) {
      throw new NotFoundException('Colaborador no encontrado');
    }
    const rows = await this.prisma.mentorshipSession.findMany({
      where: { collaboratorId: userId },
      orderBy: { sessionNumber: 'desc' },
      select: SESSION_SELECT,
    });
    if (!placement && rows.length === 0) {
      throw new NotFoundException('Colaborador no encontrado');
    }

    const today = businessToday();
    const quarter = quarterOf(today);
    const latest: SessionRow | null = rows[0] ?? null;
    const hasCurrent = rows.some((row) => row.quarter === quarter.key);
    const canRegister = canRegisterSession(viewer, placement) && !hasCurrent;
    const tracked =
      placement?.status === 'ACTIVE' &&
      placement.directBossId !== null &&
      joinedBeforeQuarter(placement, quarter);

    return {
      collaborator: placement
        ? toCollaboratorDto(placement)
        : {
            userId,
            name: rows[0].collaboratorName,
            email: null,
            position: rows[0].collaboratorPosition,
            department: null,
            boss: null,
            status: 'TERMINATED' as const,
            archived: true,
          },
      quarter: serializeQuarter(quarter),
      quarterStatus: tracked
        ? mentorshipStatus(hasCurrent, quarter, today)
        : null,
      sessions: rows.map(toSessionDto),
      permissions: { canRegister },
      draft: canRegister
        ? {
            sessionNumber: (latest?.sessionNumber ?? 0) + 1,
            mentorName: await this.actorName(viewer.id),
            today: toIsoDay(today),
            minSessionDate: latest ? toIsoDay(latest.sessionDate) : null,
            previousStart: latest
              ? {
                  sessionId: latest.id,
                  sessionNumber: latest.sessionNumber,
                  sessionDate: toIsoDay(latest.sessionDate),
                  what: latest.startWhat,
                  how: latest.startHow,
                  when: latest.startWhen,
                  indicator: latest.startIndicator,
                  commitment: latest.commitment,
                }
              : null,
          }
        : null,
    };
  }

  async getSession(viewer: MentorshipViewer, id: string) {
    const row = await this.prisma.mentorshipSession.findUnique({
      where: { id },
      select: SESSION_DETAIL_SELECT,
    });
    if (!row) throw new NotFoundException('Mentoría no encontrada');
    const placement = await this.loadPlacement(row.collaboratorId);
    if (!canViewCollaborator(viewer, placement)) {
      throw new NotFoundException('Mentoría no encontrada');
    }
    return {
      ...toSessionDto(row),
      revisions: toRevisionDtos(row.revisions),
      permissions: {
        canEdit: canEditSession(viewer, row, placement),
        canAcknowledge: canAcknowledgeSession(viewer, row),
        editRequiresReason: !!row.acknowledgedAt,
      },
    };
  }

  async create(viewer: MentorshipViewer, dto: CreateMentorshipSessionDto) {
    const placement = await this.loadPlacement(dto.collaboratorId);
    if (!placement || !canRegisterSession(viewer, placement)) {
      throw new ForbiddenException(
        'Solo el jefe directo del colaborador puede registrar su mentoría',
      );
    }

    const today = businessToday();
    const sessionDate = requireDay(
      dto.sessionDate,
      'Fecha de la sesión inválida',
    );
    const nextFollowUpDate = requireDay(
      dto.nextFollowUpDate,
      'Fecha de próximo seguimiento inválida',
    );
    if (sessionDate.getTime() > today.getTime()) {
      throw new BadRequestException(
        'La fecha de la sesión no puede ser futura',
      );
    }
    if (nextFollowUpDate.getTime() <= sessionDate.getTime()) {
      throw new BadRequestException(
        'La fecha de próximo seguimiento debe ser posterior a la fecha de la sesión',
      );
    }

    const quarter = quarterOf(sessionDate);
    const previous = await this.prisma.mentorshipSession.findFirst({
      where: { collaboratorId: dto.collaboratorId },
      orderBy: { sessionNumber: 'desc' },
      select: {
        id: true,
        sessionNumber: true,
        sessionDate: true,
        quarter: true,
      },
    });
    const evidence = dto.previousStartEvidence?.trim() || null;
    if (previous) {
      if (previous.quarter === quarter.key) {
        throw new ConflictException(
          `Ya existe una mentoría registrada para este colaborador en el ${quarter.label}`,
        );
      }
      if (sessionDate.getTime() < previous.sessionDate.getTime()) {
        throw new BadRequestException(
          `La fecha no puede ser anterior a la sesión N.º ${previous.sessionNumber}`,
        );
      }
      if (!dto.previousStartOutcome || !evidence) {
        throw new BadRequestException(
          'Evalúa el Start de la sesión anterior (Sí / Parcial / No) y escribe la evidencia antes de registrar una nueva sesión',
        );
      }
    }

    const mentorName = await this.actorName(viewer.id);
    let row: SessionRow;
    try {
      row = await this.prisma.mentorshipSession.create({
        data: {
          collaboratorId: dto.collaboratorId,
          mentorId: viewer.id,
          sessionNumber: (previous?.sessionNumber ?? 0) + 1,
          quarter: quarter.key,
          collaboratorName: placement.fullName,
          collaboratorPosition: placement.position?.name ?? null,
          collaboratorDepartment: placement.department?.name ?? null,
          mentorName,
          sessionDate,
          nextFollowUpDate,
          previousSessionId: previous?.id ?? null,
          previousStartOutcome: previous ? dto.previousStartOutcome : null,
          previousStartEvidence: previous ? evidence : null,
          ...flattenKss('keep', dto.keep),
          ...flattenKss('stop', dto.stop),
          ...flattenKss('start', dto.start),
          commitment: dto.commitment.trim(),
        },
        select: SESSION_SELECT,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'Otra persona registró esta mentoría al mismo tiempo. Recarga la página.',
        );
      }
      throw error;
    }

    await this.notifySessionRegistered(row);
    return toSessionDto(row);
  }

  async update(
    viewer: MentorshipViewer,
    id: string,
    dto: UpdateMentorshipSessionDto,
  ) {
    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id },
      select: SESSION_SELECT,
    });
    if (!session) throw new NotFoundException('Mentoría no encontrada');
    const placement = await this.loadPlacement(session.collaboratorId);
    if (!canViewCollaborator(viewer, placement)) {
      throw new NotFoundException('Mentoría no encontrada');
    }
    if (!canEditSession(viewer, session, placement)) {
      throw new ForbiddenException(
        session.acknowledgedAt
          ? 'El colaborador ya confirmó esta sesión; solo Talento Humano puede corregirla'
          : 'Solo el jefe directo del colaborador puede editar esta sesión',
      );
    }
    const reason = dto.reason?.trim() || null;
    if (session.acknowledgedAt && !reason) {
      throw new BadRequestException(
        'Indica el motivo de la corrección: la sesión ya fue confirmada por el colaborador',
      );
    }

    const next = this.buildUpdate(session, dto);
    const changes = diffSession(editableValues(session), next);
    if (changes.length === 0) return this.getSession(viewer, id);

    const actorName = await this.actorName(viewer.id);
    await this.prisma.$transaction([
      this.prisma.mentorshipSession.update({ where: { id }, data: next }),
      this.prisma.mentorshipSessionRevision.create({
        data: {
          sessionId: id,
          actorId: viewer.id,
          actorName,
          changes: changes as unknown as Prisma.InputJsonValue,
          reason,
        },
      }),
    ]);

    const href = mentorshipSessionHref(id);
    if (session.acknowledgedAt) {
      await this.notifier.inApp(
        [
          session.collaboratorId,
          placement?.directBossId ?? session.mentorId,
        ].filter(
          (userId): userId is string => !!userId && userId !== viewer.id,
        ),
        `Talento Humano corrigió la mentoría N.º ${session.sessionNumber} de ${session.collaboratorName}.`,
        href,
      );
    } else if (session.collaboratorId !== viewer.id) {
      await this.notifier.inApp(
        [session.collaboratorId],
        `${actorName} actualizó los acuerdos de tu mentoría N.º ${session.sessionNumber}.`,
        href,
      );
    }

    return this.getSession(viewer, id);
  }

  private buildUpdate(
    session: SessionRow,
    dto: UpdateMentorshipSessionDto,
  ): Partial<EditableSessionValues> {
    const today = businessToday();
    const next: Partial<EditableSessionValues> = {};

    if (dto.sessionDate !== undefined) {
      const day = requireDay(dto.sessionDate, 'Fecha de la sesión inválida');
      const quarter = quarterOf(day);
      if (quarter.key !== session.quarter) {
        throw new BadRequestException(
          `La fecha de la sesión debe quedar dentro del ${parseQuarterKey(session.quarter)?.label ?? session.quarter}`,
        );
      }
      if (day.getTime() > today.getTime()) {
        throw new BadRequestException(
          'La fecha de la sesión no puede ser futura',
        );
      }
      if (
        session.previousSession &&
        day.getTime() < session.previousSession.sessionDate.getTime()
      ) {
        throw new BadRequestException(
          `La fecha no puede ser anterior a la sesión N.º ${session.previousSession.sessionNumber}`,
        );
      }
      next.sessionDate = day;
    }
    if (dto.nextFollowUpDate !== undefined) {
      next.nextFollowUpDate = requireDay(
        dto.nextFollowUpDate,
        'Fecha de próximo seguimiento inválida',
      );
    }
    const sessionDate = next.sessionDate ?? session.sessionDate;
    const followUp = next.nextFollowUpDate ?? session.nextFollowUpDate;
    if (followUp.getTime() <= sessionDate.getTime()) {
      throw new BadRequestException(
        'La fecha de próximo seguimiento debe ser posterior a la fecha de la sesión',
      );
    }

    if (
      dto.previousStartOutcome !== undefined ||
      dto.previousStartEvidence !== undefined
    ) {
      if (!session.previousSessionId) {
        throw new BadRequestException(
          'Esta es la primera sesión: no hay un Start anterior que evaluar',
        );
      }
      if (dto.previousStartOutcome !== undefined) {
        next.previousStartOutcome = dto.previousStartOutcome;
      }
      if (dto.previousStartEvidence !== undefined) {
        const evidence = dto.previousStartEvidence.trim();
        if (!evidence) {
          throw new BadRequestException(
            'La evidencia del Start anterior es obligatoria',
          );
        }
        next.previousStartEvidence = evidence;
      }
    }

    if (dto.keep) Object.assign(next, flattenKss('keep', dto.keep));
    if (dto.stop) Object.assign(next, flattenKss('stop', dto.stop));
    if (dto.start) Object.assign(next, flattenKss('start', dto.start));
    if (dto.commitment !== undefined) next.commitment = dto.commitment.trim();
    return next;
  }

  async acknowledge(
    viewer: MentorshipViewer,
    id: string,
    dto: AcknowledgeMentorshipSessionDto,
  ) {
    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id },
      select: {
        collaboratorId: true,
        collaboratorName: true,
        sessionNumber: true,
        mentorId: true,
        acknowledgedAt: true,
      },
    });
    if (!session || session.collaboratorId !== viewer.id) {
      throw new NotFoundException('Mentoría no encontrada');
    }
    if (!canAcknowledgeSession(viewer, session)) {
      throw new ConflictException('Ya confirmaste de recibido esta sesión');
    }

    const updated = await this.prisma.mentorshipSession.updateMany({
      where: { id, acknowledgedAt: null },
      data: {
        acknowledgedAt: new Date(),
        acknowledgementComment: dto.comment?.trim() || null,
      },
    });
    if (updated.count === 0) {
      throw new ConflictException('Ya confirmaste de recibido esta sesión');
    }

    const placement = await this.loadPlacement(session.collaboratorId);
    const bossId = placement?.directBossId ?? session.mentorId;
    if (bossId) {
      await this.notifier.inApp(
        [bossId],
        `${session.collaboratorName} confirmó de recibido la mentoría N.º ${session.sessionNumber}${dto.comment?.trim() ? ' y dejó un comentario' : ''}.`,
        mentorshipSessionHref(id),
        'LOW',
      );
    }
    return this.getSession(viewer, id);
  }

  private async notifySessionRegistered(row: SessionRow) {
    const href = mentorshipSessionHref(row.id);
    await this.notifier.inApp(
      [row.collaboratorId],
      `${row.mentorName} registró tu mentoría N.º ${row.sessionNumber}. Revisa los acuerdos y confirma de recibido.`,
      href,
      'HIGH',
    );
    const recipient = await this.notifier.recipient(row.collaboratorId);
    if (!recipient) return;
    await this.notifier.sendEmail(
      recipient.email,
      buildSessionRegisteredEmail({
        collaboratorName: recipient.name,
        mentorName: row.mentorName,
        sessionNumber: row.sessionNumber,
        startWhat: row.startWhat,
        commitment: row.commitment,
        nextFollowUpDate: row.nextFollowUpDate,
        url: this.notifier.url(href),
      }),
    );
  }
}
