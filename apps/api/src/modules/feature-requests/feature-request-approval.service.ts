import { Injectable } from '@nestjs/common';
import { FeatureRequestEventType, FeatureRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { FeatureRequestNotifier } from './feature-request-notifier.js';
import { signatureProgress } from './feature-request.mapper.js';
import {
  devRequestHref,
  formatTicketNumber,
  userRequestHref,
} from './feature-requests.constants.js';

@Injectable()
export class FeatureRequestApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: FeatureRequestNotifier,
  ) {}

  /**
   * Approves a completed request once every participant signed the current
   * delivery. Safe to call after any change to the participants or signatures:
   * the conditional update makes the transition happen only once.
   */
  async settle(requestId: string): Promise<boolean> {
    const row = await this.prisma.featureRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        completionRound: true,
        requester: { select: { id: true } },
        collaborators: { select: { userId: true } },
        signatures: { select: { userId: true, round: true } },
      },
    });
    if (!row || row.status !== FeatureRequestStatus.COMPLETED) return false;

    const progress = signatureProgress(row);
    if (progress.signed < progress.required) return false;

    const approved = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.featureRequest.updateMany({
        where: { id: requestId, status: FeatureRequestStatus.COMPLETED },
        data: { status: FeatureRequestStatus.APPROVED, approvedAt: new Date() },
      });
      if (updated.count === 0) return false;
      await tx.featureRequestEvent.create({
        data: {
          requestId,
          type: FeatureRequestEventType.APPROVED,
          fromStatus: FeatureRequestStatus.COMPLETED,
          toStatus: FeatureRequestStatus.APPROVED,
          message: 'Todos los participantes firmaron la aprobación',
        },
      });
      return true;
    });
    if (!approved) return false;

    const ticket = formatTicketNumber(row.number);
    await Promise.all([
      this.notifier.toDevelopers(
        `${ticket} fue aprobada por todos los participantes: ${row.title}`,
        devRequestHref(row.id),
        'LOW',
      ),
      this.notifier.toUsers(
        progress.participantIds,
        `${ticket} quedó aprobada. ¡Gracias por tu firma!`,
        userRequestHref(row.id),
        'LOW',
      ),
    ]);
    return true;
  }
}
