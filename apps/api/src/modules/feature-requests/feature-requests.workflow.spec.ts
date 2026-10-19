/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { FeatureRequestStatus } from '@prisma/client';
import { FeatureRequestApprovalService } from './feature-request-approval.service';
import { FeatureRequestSignaturesService } from './feature-request-signatures.service';
import { signatureProgress, toListItem } from './feature-request.mapper';
import { FeatureRequestsDevService } from './feature-requests-dev.service';
import type { FeatureRequestListRow } from './feature-request.selects';

const user = (id: string) => ({
  id,
  firstName: id,
  lastName: null,
  email: `${id}@veo.test`,
});

function row(
  overrides: Partial<FeatureRequestListRow> = {},
): FeatureRequestListRow {
  return {
    id: 'req-1',
    number: 7,
    title: 'Recordatorio de contratos',
    summary: 'Avisar antes de vencer',
    priority: 'MEDIUM',
    status: FeatureRequestStatus.COMPLETED,
    completionRound: 2,
    completedAt: new Date(),
    approvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    requester: user('ana'),
    collaborators: [{ userId: 'bob' }],
    signatures: [],
    ...overrides,
  };
}

describe('signatureProgress', () => {
  it('counts only signatures of the current round', () => {
    const progress = signatureProgress(
      row({
        signatures: [
          { userId: 'ana', round: 1 },
          { userId: 'bob', round: 2 },
        ],
      }),
    );
    expect(progress.required).toBe(2);
    expect(progress.signed).toBe(1);
    expect(progress.signedIds.has('bob')).toBe(true);
    expect(progress.signedIds.has('ana')).toBe(false);
  });

  it('ignores signatures from people who are no longer participants', () => {
    const progress = signatureProgress(
      row({
        collaborators: [],
        signatures: [{ userId: 'bob', round: 2 }],
      }),
    );
    expect(progress.required).toBe(1);
    expect(progress.signed).toBe(0);
  });
});

describe('toListItem', () => {
  it('flags requests waiting for the viewer signature', () => {
    const item = row({ signatures: [{ userId: 'ana', round: 2 }] });
    expect(toListItem(item, 'bob').awaitingMySignature).toBe(true);
    expect(toListItem(item, 'ana').awaitingMySignature).toBe(false);
    expect(toListItem(item, 'stranger').awaitingMySignature).toBe(false);
  });

  it('never asks for a signature before the request is completed', () => {
    const item = row({ status: FeatureRequestStatus.IN_PROGRESS });
    expect(toListItem(item, 'bob').awaitingMySignature).toBe(false);
  });
});

function createPrismaMock() {
  const prisma = {
    featureRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    featureRequestEvent: { create: jest.fn() },
    featureRequestSignature: { create: jest.fn() },
    user: { findUniqueOrThrow: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
    callback(prisma),
  );
  return prisma;
}

function createNotifierMock() {
  return {
    toDevelopers: jest.fn().mockResolvedValue(undefined),
    toUsers: jest.fn().mockResolvedValue(undefined),
  };
}

describe('FeatureRequestApprovalService', () => {
  const completed = (signatures: { userId: string; round: number }[]) => ({
    id: 'req-1',
    number: 7,
    title: 'Recordatorio',
    status: FeatureRequestStatus.COMPLETED,
    completionRound: 1,
    requester: { id: 'ana' },
    collaborators: [{ userId: 'bob' }],
    signatures,
  });

  it('approves once every participant signed the current round', async () => {
    const prisma = createPrismaMock();
    const notifier = createNotifierMock();
    prisma.featureRequest.findUnique.mockResolvedValue(
      completed([
        { userId: 'ana', round: 1 },
        { userId: 'bob', round: 1 },
      ]),
    );
    prisma.featureRequest.updateMany.mockResolvedValue({ count: 1 });
    const service = new FeatureRequestApprovalService(
      prisma as never,
      notifier as never,
    );

    await expect(service.settle('req-1')).resolves.toBe(true);
    expect(prisma.featureRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1', status: FeatureRequestStatus.COMPLETED },
      }),
    );
    expect(notifier.toDevelopers).toHaveBeenCalledTimes(1);
    expect(notifier.toUsers).toHaveBeenCalledWith(
      ['ana', 'bob'],
      expect.any(String),
      expect.any(String),
      'LOW',
    );
  });

  it('waits while a participant still has to sign', async () => {
    const prisma = createPrismaMock();
    prisma.featureRequest.findUnique.mockResolvedValue(
      completed([{ userId: 'ana', round: 1 }]),
    );
    const service = new FeatureRequestApprovalService(
      prisma as never,
      createNotifierMock() as never,
    );

    await expect(service.settle('req-1')).resolves.toBe(false);
    expect(prisma.featureRequest.updateMany).not.toHaveBeenCalled();
  });

  it('does not approve twice when another call already did', async () => {
    const prisma = createPrismaMock();
    const notifier = createNotifierMock();
    prisma.featureRequest.findUnique.mockResolvedValue(
      completed([
        { userId: 'ana', round: 1 },
        { userId: 'bob', round: 1 },
      ]),
    );
    prisma.featureRequest.updateMany.mockResolvedValue({ count: 0 });
    const service = new FeatureRequestApprovalService(
      prisma as never,
      notifier as never,
    );

    await expect(service.settle('req-1')).resolves.toBe(false);
    expect(notifier.toDevelopers).not.toHaveBeenCalled();
  });
});

describe('FeatureRequestsDevService.updateStatus', () => {
  const current = (status: FeatureRequestStatus) => ({
    number: 7,
    title: 'Recordatorio',
    status,
    requester: { id: 'ana' },
    collaborators: [{ userId: 'bob' }],
  });
  const dev = { id: 'dev', isDeveloper: true };

  function setup(status: FeatureRequestStatus) {
    const prisma = createPrismaMock();
    const notifier = createNotifierMock();
    const requests = { getDetail: jest.fn().mockResolvedValue({}) };
    prisma.featureRequest.findUnique.mockResolvedValue(current(status));
    const service = new FeatureRequestsDevService(
      prisma as never,
      notifier as never,
      requests as never,
    );
    return { prisma, notifier, service };
  }

  it('opens a new signing round and asks participants to sign on completion', async () => {
    const { prisma, notifier, service } = setup(
      FeatureRequestStatus.IN_PROGRESS,
    );

    await service.updateStatus(
      'req-1',
      { status: FeatureRequestStatus.COMPLETED },
      dev,
    );

    expect(prisma.featureRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: expect.objectContaining({
        status: FeatureRequestStatus.COMPLETED,
        completionRound: { increment: 1 },
      }),
    });
    expect(notifier.toUsers).toHaveBeenCalledWith(
      ['ana', 'bob'],
      expect.stringContaining('firma'),
      expect.stringContaining('request=req-1'),
      'HIGH',
    );
  });

  it('requires a reason to reject', async () => {
    const { service } = setup(FeatureRequestStatus.SUBMITTED);
    await expect(
      service.updateStatus(
        'req-1',
        { status: FeatureRequestStatus.REJECTED },
        dev,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('locks approved requests', async () => {
    const { service } = setup(FeatureRequestStatus.APPROVED);
    await expect(
      service.updateStatus(
        'req-1',
        { status: FeatureRequestStatus.IN_PROGRESS },
        dev,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a note without changing the status', async () => {
    const { prisma, service } = setup(FeatureRequestStatus.IN_PROGRESS);

    await service.updateStatus(
      'req-1',
      { status: FeatureRequestStatus.IN_PROGRESS, message: 'Avanzando' },
      dev,
    );

    expect(prisma.featureRequest.update).not.toHaveBeenCalled();
    expect(prisma.featureRequestEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'COMMENT', message: 'Avanzando' }),
    });
  });
});

describe('FeatureRequestSignaturesService.sign', () => {
  const PNG_HEADER = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);
  const validImage = `data:image/png;base64,${PNG_HEADER.toString('base64')}`;
  const dto = { signatureImage: validImage, accepted: true as const };

  function setup(signatures: { userId: string; round: number }[]) {
    const prisma = createPrismaMock();
    const storage = {
      uploadBuffer: jest.fn().mockResolvedValue({ key: 'sig.png' }),
      deleteByKey: jest.fn().mockResolvedValue(undefined),
    };
    const approval = { settle: jest.fn().mockResolvedValue(false) };
    const requests = { getDetail: jest.fn().mockResolvedValue({}) };
    prisma.featureRequest.findUnique.mockResolvedValue({
      number: 7,
      title: 'Recordatorio',
      status: FeatureRequestStatus.COMPLETED,
      completionRound: 1,
      requester: { id: 'ana' },
      collaborators: [{ userId: 'bob' }],
      signatures,
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue(user('bob'));
    const service = new FeatureRequestSignaturesService(
      prisma as never,
      storage as never,
      createNotifierMock() as never,
      approval as never,
      requests as never,
    );
    return { prisma, storage, approval, service };
  }

  it('stores the signature with its evidence and settles the approval', async () => {
    const { prisma, approval, service } = setup([]);
    prisma.featureRequest.findUnique
      .mockResolvedValueOnce({
        number: 7,
        title: 'Recordatorio',
        status: FeatureRequestStatus.COMPLETED,
        completionRound: 1,
        requester: { id: 'ana' },
        collaborators: [{ userId: 'bob' }],
        signatures: [],
      })
      .mockResolvedValueOnce({
        status: FeatureRequestStatus.COMPLETED,
        completionRound: 1,
      });

    await service.sign('req-1', { id: 'bob', isDeveloper: false }, dto, {
      ipAddress: '10.0.0.1',
      userAgent: 'jest',
    });

    expect(prisma.featureRequestSignature.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        requestId: 'req-1',
        userId: 'bob',
        round: 1,
        signerEmail: 'bob@veo.test',
        imageS3Key: 'sig.png',
        ipAddress: '10.0.0.1',
      }),
    });
    expect(approval.settle).toHaveBeenCalledWith('req-1');
  });

  it('rejects a second signature for the same delivery', async () => {
    const { service } = setup([{ userId: 'bob', round: 1 }]);
    await expect(
      service.sign('req-1', { id: 'bob', isDeveloper: false }, dto, {}),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects images that are not PNG files', async () => {
    const { storage, service } = setup([]);
    await expect(
      service.sign(
        'req-1',
        { id: 'bob', isDeveloper: false },
        { ...dto, signatureImage: 'data:image/png;base64,AAAA' },
        {},
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.uploadBuffer).not.toHaveBeenCalled();
  });

  it('hides the request from people who do not take part in it', async () => {
    const { service } = setup([]);
    await expect(
      service.sign('req-1', { id: 'stranger', isDeveloper: false }, dto, {}),
    ).rejects.toThrow('Solicitud no encontrada');
  });
});
