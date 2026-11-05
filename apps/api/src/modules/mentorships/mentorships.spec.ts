/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  canAcknowledgeSession,
  canEditSession,
  canRegisterSession,
  canViewCollaborator,
  type CollaboratorPlacement,
} from './mentorship-access';
import { summarize, summarizeByDepartment } from './mentorship-dashboard';
import {
  addDays,
  businessToday,
  joinedBeforeQuarter,
  mentorshipStatus,
  parseIsoDay,
  parseQuarterKey,
  previousQuarter,
  quarterOf,
  quartersBetween,
  toIsoDay,
} from './mentorship-quarter';
import { diffSession } from './mentorship-revisions';
import { overdueByDepartment, planQuarterNotices } from './mentorship-sweep';
import { MentorshipsService } from './mentorships.service';

const day = (iso: string) => parseIsoDay(iso)!;

describe('mentorship quarters', () => {
  it('uses the end of the first month as the deadline', () => {
    const q1 = quarterOf(day('2027-02-14'));
    expect(q1.key).toBe('2027-Q1');
    expect(q1.label).toBe('T1 2027');
    expect(toIsoDay(q1.start)).toBe('2027-01-01');
    expect(toIsoDay(q1.deadline)).toBe('2027-01-31');
    expect(toIsoDay(q1.end)).toBe('2027-03-31');

    const q2 = quarterOf(day('2026-05-01'));
    expect(toIsoDay(q2.deadline)).toBe('2026-04-30');
    expect(toIsoDay(q2.end)).toBe('2026-06-30');
  });

  it('reads the calendar day in El Salvador time', () => {
    expect(toIsoDay(businessToday(new Date('2026-11-06T03:00:00Z')))).toBe(
      '2026-11-05',
    );
    expect(toIsoDay(businessToday(new Date('2026-11-06T07:00:00Z')))).toBe(
      '2026-11-06',
    );
  });

  it('marks a missing session overdue only after the deadline day', () => {
    const quarter = quarterOf(day('2026-10-15'));
    expect(mentorshipStatus(false, quarter, day('2026-10-31'))).toBe('PENDING');
    expect(mentorshipStatus(false, quarter, day('2026-11-01'))).toBe('OVERDUE');
    expect(mentorshipStatus(true, quarter, day('2026-12-01'))).toBe('DONE');
  });

  it('parses quarter keys and walks back across years', () => {
    expect(parseQuarterKey('2026-Q5')).toBeNull();
    const q1 = parseQuarterKey('2027-Q1')!;
    expect(previousQuarter(q1).key).toBe('2026-Q4');
    expect(
      quartersBetween(parseQuarterKey('2026-Q3')!, q1).map((q) => q.key),
    ).toEqual(['2027-Q1', '2026-Q4', '2026-Q3']);
  });

  it('rejects impossible calendar days', () => {
    expect(parseIsoDay('2026-02-30')).toBeNull();
    expect(parseIsoDay('26-02-01')).toBeNull();
  });

  it('skips collaborators who joined during the quarter', () => {
    const q4 = parseQuarterKey('2026-Q4')!;
    const member = (startDate: string | null, createdAt: string) => ({
      startDate: startDate ? day(startDate) : null,
      createdAt: new Date(createdAt),
    });
    expect(
      joinedBeforeQuarter(member('2026-09-30', '2026-11-01T00:00:00Z'), q4),
    ).toBe(true);
    expect(
      joinedBeforeQuarter(member('2026-10-01', '2026-01-01T00:00:00Z'), q4),
    ).toBe(false);
    expect(joinedBeforeQuarter(member(null, '2026-10-01T05:59:00Z'), q4)).toBe(
      true,
    );
    expect(joinedBeforeQuarter(member(null, '2026-10-01T06:00:00Z'), q4)).toBe(
      false,
    );
  });
});

describe('mentorship access', () => {
  const hr = { id: 'hr', isHr: true };
  const boss = { id: 'boss', isHr: false };
  const otherBoss = { id: 'other', isHr: false };
  const collaborator = { id: 'ana', isHr: false };
  const placement = (
    overrides: Partial<CollaboratorPlacement> = {},
  ): CollaboratorPlacement => ({
    userId: 'ana',
    status: 'ACTIVE',
    directBossId: 'boss',
    ...overrides,
  });

  it('keeps sessions confidential to the collaborator, the boss and HR', () => {
    expect(canViewCollaborator(collaborator, placement())).toBe(true);
    expect(canViewCollaborator(boss, placement())).toBe(true);
    expect(canViewCollaborator(hr, placement())).toBe(true);
    expect(canViewCollaborator(otherBoss, placement())).toBe(false);
  });

  it('hands the history to the new boss after a change of boss', () => {
    const moved = placement({ directBossId: 'other' });
    expect(canViewCollaborator(boss, moved)).toBe(false);
    expect(canViewCollaborator(otherBoss, moved)).toBe(true);
    expect(canRegisterSession(otherBoss, moved)).toBe(true);
  });

  it('archives the history for HR only when the collaborator leaves', () => {
    const left = placement({ status: 'TERMINATED' });
    expect(canViewCollaborator(collaborator, left)).toBe(false);
    expect(canViewCollaborator(boss, left)).toBe(false);
    expect(canViewCollaborator(hr, left)).toBe(true);
    expect(canViewCollaborator(hr, null)).toBe(true);
    expect(canViewCollaborator(boss, null)).toBe(false);
  });

  it('lets only the direct boss register sessions', () => {
    expect(canRegisterSession(boss, placement())).toBe(true);
    expect(canRegisterSession(hr, placement())).toBe(false);
    expect(canRegisterSession(collaborator, placement())).toBe(false);
  });

  it('locks a confirmed session for everybody but HR', () => {
    const open = { acknowledgedAt: null };
    const confirmed = { acknowledgedAt: new Date() };
    expect(canEditSession(boss, open, placement())).toBe(true);
    expect(canEditSession(boss, confirmed, placement())).toBe(false);
    expect(canEditSession(hr, confirmed, placement())).toBe(true);
    expect(canEditSession(collaborator, open, placement())).toBe(false);
  });

  it('lets only the collaborator confirm, once', () => {
    const session = { collaboratorId: 'ana', acknowledgedAt: null };
    expect(canAcknowledgeSession(collaborator, session)).toBe(true);
    expect(canAcknowledgeSession(boss, session)).toBe(false);
    expect(
      canAcknowledgeSession(collaborator, {
        ...session,
        acknowledgedAt: new Date(),
      }),
    ).toBe(false);
  });
});

describe('mentorship notices', () => {
  const eligible = [
    {
      userId: 'ana',
      name: 'Ana',
      departmentName: 'Comercial',
      boss: { id: 'b1', name: 'Bea', email: 'bea@veo.test' },
    },
    {
      userId: 'luis',
      name: 'Luis',
      departmentName: 'Comercial',
      boss: { id: 'b1', name: 'Bea', email: 'bea@veo.test' },
    },
    {
      userId: 'eva',
      name: 'Eva',
      departmentName: 'Operaciones',
      boss: { id: 'b2', name: 'Raúl', email: 'raul@veo.test' },
    },
  ];
  const quarter = quarterOf(day('2027-01-05'));

  it('lists each boss exactly the collaborators still pending', () => {
    const plan = planQuarterNotices(
      eligible,
      new Set(['luis']),
      quarter,
      day('2027-01-02'),
    );
    expect(plan.phase).toBe('QUARTER_START');
    expect(
      plan.groups.map((g) => [g.boss.id, g.collaborators.map((c) => c.name)]),
    ).toEqual([
      ['b1', ['Ana']],
      ['b2', ['Eva']],
    ]);
  });

  it('switches to overdue after the deadline and skips bosses with everything done', () => {
    const plan = planQuarterNotices(
      eligible,
      new Set(['eva']),
      quarter,
      day('2027-02-01'),
    );
    expect(plan.phase).toBe('OVERDUE');
    expect(plan.groups.map((g) => g.boss.id)).toEqual(['b1']);
    expect(overdueByDepartment(eligible, new Set(['eva']))).toEqual([
      { name: 'Comercial', overdue: 2, total: 2 },
    ]);
  });
});

describe('diffSession', () => {
  const current = {
    sessionDate: day('2026-11-02'),
    nextFollowUpDate: day('2026-12-01'),
    previousStartOutcome: 'PARTIAL' as const,
    previousStartEvidence: '7 de 10 visitas',
    keepWhat: 'k',
    keepHow: 'k',
    keepWhen: 'k',
    keepIndicator: 'k',
    stopWhat: 's',
    stopHow: 's',
    stopWhen: 's',
    stopIndicator: 's',
    startWhat: 'Registrar visitas el mismo día',
    startHow: 'h',
    startWhen: 'w',
    startIndicator: 'i',
    commitment: 'c',
  };

  it('records only what changed, with readable labels and values', () => {
    expect(
      diffSession(current, {
        startWhat: 'Registrar visitas el mismo día',
        previousStartOutcome: 'YES',
        nextFollowUpDate: day('2026-12-15'),
      }),
    ).toEqual([
      {
        field: 'nextFollowUpDate',
        label: 'Fecha de próximo seguimiento',
        from: '2026-12-01',
        to: '2026-12-15',
      },
      {
        field: 'previousStartOutcome',
        label: 'Start anterior: ¿se cumplió?',
        from: 'Parcial',
        to: 'Sí',
      },
    ]);
  });
});

describe('mentorship dashboard', () => {
  it('summarizes compliance per area', () => {
    const rows = [
      {
        departmentId: 'd1',
        departmentName: 'Comercial',
        status: 'DONE' as const,
        startOutcome: 'YES' as const,
      },
      {
        departmentId: 'd1',
        departmentName: 'Comercial',
        status: 'DONE' as const,
        startOutcome: 'NO' as const,
      },
      {
        departmentId: 'd1',
        departmentName: 'Comercial',
        status: 'OVERDUE' as const,
        startOutcome: null,
      },
      {
        departmentId: null,
        departmentName: 'Sin área asignada',
        status: 'PENDING' as const,
        startOutcome: null,
      },
    ];
    const totals = summarize(rows);
    expect(totals).toMatchObject({
      collaborators: 4,
      done: 2,
      pending: 1,
      overdue: 1,
      startEvaluated: 2,
      startCompliance: 50,
      completion: 50,
    });
    const departments = summarizeByDepartment(rows);
    expect(departments.map((d) => [d.name, d.done, d.collaborators])).toEqual([
      ['Comercial', 2, 3],
      ['Sin área asignada', 0, 1],
    ]);
    expect(departments[1].startCompliance).toBeNull();
  });
});

describe('MentorshipsService', () => {
  const boss = { id: 'boss', isHr: false };
  const today = businessToday();
  const lastQuarterDay = previousQuarter(quarterOf(today)).start;
  const kss = {
    what: 'Qué',
    how: 'Cómo',
    when: 'Cuándo',
    indicator: 'Indicador',
  };
  const placement = {
    id: 'tm-ana',
    userId: 'ana',
    fullName: 'Ana Pérez',
    status: 'ACTIVE',
    directBossId: 'boss',
    businessEmail: 'ana@veo.test',
    startDate: day('2025-01-06'),
    createdAt: new Date('2025-01-06T15:00:00Z'),
    position: { name: 'Asesora' },
    department: { id: 'd1', name: 'Comercial' },
    directBoss: { id: 'boss', firstName: 'Bea', lastName: null },
    user: { email: 'ana@veo.test' },
  };
  const dto = (overrides: Record<string, unknown> = {}) =>
    ({
      collaboratorId: 'ana',
      sessionDate: toIsoDay(today),
      nextFollowUpDate: toIsoDay(addDays(today, 30)),
      keep: kss,
      stop: kss,
      start: kss,
      commitment: 'Compromiso',
      ...overrides,
    }) as never;

  function setup() {
    const prisma = {
      teamMember: { findUnique: jest.fn().mockResolvedValue(placement) },
      mentorshipSession: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      mentorshipSessionRevision: { create: jest.fn() },
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          firstName: 'Bea',
          lastName: null,
          teamMember: { fullName: 'Bea Gómez' },
        }),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const notifier = {
      inApp: jest.fn().mockResolvedValue(undefined),
      sendEmail: jest.fn().mockResolvedValue(undefined),
      recipient: jest.fn().mockResolvedValue(null),
      url: (path: string) => path,
    };
    const service = new MentorshipsService(
      prisma as never,
      notifier as never,
      { runIfStale: jest.fn() } as never,
    );
    return { prisma, notifier, service };
  }

  const createdRow = (data: Record<string, unknown>) => ({
    ...data,
    id: 'sess-1',
    acknowledgedAt: null,
    acknowledgementComment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    previousSession: null,
  });

  it('rejects anyone but the direct boss', async () => {
    const { service } = setup();
    await expect(
      service.create({ id: 'other', isHr: true }, dto()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('registers the first session with snapshots and notifies the collaborator', async () => {
    const { prisma, notifier, service } = setup();
    prisma.mentorshipSession.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(createdRow(data)),
    );

    const session = await service.create(boss, dto());

    expect(prisma.mentorshipSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionNumber: 1,
          quarter: quarterOf(today).key,
          collaboratorName: 'Ana Pérez',
          collaboratorPosition: 'Asesora',
          collaboratorDepartment: 'Comercial',
          mentorName: 'Bea Gómez',
          previousSessionId: null,
          startWhat: 'Qué',
        }),
      }),
    );
    expect(session.sessionNumber).toBe(1);
    expect(notifier.inApp).toHaveBeenCalledWith(
      ['ana'],
      expect.stringContaining('confirma de recibido'),
      '/dashboard/rh/mentorias?session=sess-1',
      'HIGH',
    );
  });

  it('requires evaluating the previous Start before a new session', async () => {
    const { prisma, service } = setup();
    prisma.mentorshipSession.findFirst.mockResolvedValue({
      id: 'prev',
      sessionNumber: 1,
      sessionDate: lastQuarterDay,
      quarter: quarterOf(lastQuarterDay).key,
    });

    await expect(service.create(boss, dto())).rejects.toThrow(
      'Evalúa el Start de la sesión anterior',
    );
    await expect(
      service.create(boss, dto({ previousStartOutcome: 'YES' })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.mentorshipSession.create).not.toHaveBeenCalled();
  });

  it('chains the new session to the evaluated one', async () => {
    const { prisma, service } = setup();
    prisma.mentorshipSession.findFirst.mockResolvedValue({
      id: 'prev',
      sessionNumber: 3,
      sessionDate: lastQuarterDay,
      quarter: quarterOf(lastQuarterDay).key,
    });
    prisma.mentorshipSession.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve(createdRow(data)),
    );

    await service.create(
      boss,
      dto({
        previousStartOutcome: 'PARTIAL',
        previousStartEvidence: '  7 de 10 visitas  ',
      }),
    );

    expect(prisma.mentorshipSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionNumber: 4,
          previousSessionId: 'prev',
          previousStartOutcome: 'PARTIAL',
          previousStartEvidence: '7 de 10 visitas',
        }),
      }),
    );
  });

  it('allows one session per collaborator and quarter', async () => {
    const { prisma, service } = setup();
    prisma.mentorshipSession.findFirst.mockResolvedValue({
      id: 'prev',
      sessionNumber: 1,
      sessionDate: today,
      quarter: quarterOf(today).key,
    });
    await expect(
      service.create(
        boss,
        dto({ previousStartOutcome: 'YES', previousStartEvidence: 'ok' }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects future sessions and follow-ups that are not after the session', async () => {
    const { service } = setup();
    await expect(
      service.create(boss, dto({ sessionDate: toIsoDay(addDays(today, 1)) })),
    ).rejects.toThrow('no puede ser futura');
    await expect(
      service.create(boss, dto({ nextFollowUpDate: toIsoDay(today) })),
    ).rejects.toThrow('posterior a la fecha de la sesión');
  });

  const storedSession = (overrides: Record<string, unknown> = {}) => ({
    ...createdRow({
      collaboratorId: 'ana',
      mentorId: 'boss',
      sessionNumber: 1,
      quarter: quarterOf(today).key,
      collaboratorName: 'Ana Pérez',
      collaboratorPosition: 'Asesora',
      collaboratorDepartment: 'Comercial',
      mentorName: 'Bea Gómez',
      sessionDate: today,
      nextFollowUpDate: addDays(today, 30),
      previousSessionId: null,
      previousStartOutcome: null,
      previousStartEvidence: null,
      keepWhat: 'Qué',
      keepHow: 'Cómo',
      keepWhen: 'Cuándo',
      keepIndicator: 'Indicador',
      stopWhat: 'Qué',
      stopHow: 'Cómo',
      stopWhen: 'Cuándo',
      stopIndicator: 'Indicador',
      startWhat: 'Qué',
      startHow: 'Cómo',
      startWhen: 'Cuándo',
      startIndicator: 'Indicador',
      commitment: 'Compromiso',
    }),
    ...overrides,
  });

  it('blocks the boss from editing a confirmed session', async () => {
    const { prisma, service } = setup();
    prisma.mentorshipSession.findUnique.mockResolvedValue(
      storedSession({ acknowledgedAt: new Date() }),
    );
    await expect(
      service.update(boss, 'sess-1', { commitment: 'Otro' } as never),
    ).rejects.toThrow('solo Talento Humano puede corregirla');
  });

  it('asks HR for a reason and records who changed what', async () => {
    const { prisma, service } = setup();
    prisma.mentorshipSession.findUnique.mockResolvedValue(
      storedSession({ acknowledgedAt: new Date(), revisions: [] }),
    );
    const hr = { id: 'hr', isHr: true };

    await expect(
      service.update(hr, 'sess-1', { commitment: 'Otro' } as never),
    ).rejects.toThrow('motivo de la corrección');

    await service.update(hr, 'sess-1', {
      commitment: 'Otro',
      reason: 'Error de digitación',
    } as never);
    expect(prisma.mentorshipSessionRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 'sess-1',
        actorId: 'hr',
        actorName: 'Bea Gómez',
        reason: 'Error de digitación',
        changes: [
          {
            field: 'commitment',
            label: 'Compromiso concreto',
            from: 'Compromiso',
            to: 'Otro',
          },
        ],
      }),
    });
  });

  it('hides sessions from people outside the chain', async () => {
    const { prisma, service } = setup();
    prisma.mentorshipSession.findUnique.mockResolvedValue(
      storedSession({ revisions: [] }),
    );
    await expect(
      service.getSession({ id: 'stranger', isHr: false }, 'sess-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lets the collaborator confirm once and tells the boss', async () => {
    const { prisma, notifier, service } = setup();
    prisma.mentorshipSession.findUnique
      .mockResolvedValueOnce(storedSession())
      .mockResolvedValueOnce(
        storedSession({ acknowledgedAt: new Date(), revisions: [] }),
      );
    prisma.mentorshipSession.updateMany.mockResolvedValue({ count: 1 });

    await service.acknowledge({ id: 'ana', isHr: false }, 'sess-1', {
      comment: 'Gracias',
    });

    expect(prisma.mentorshipSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'sess-1', acknowledgedAt: null },
      data: expect.objectContaining({ acknowledgementComment: 'Gracias' }),
    });
    expect(notifier.inApp).toHaveBeenCalledWith(
      ['boss'],
      expect.stringContaining('confirmó de recibido'),
      expect.any(String),
      'LOW',
    );
  });
});
