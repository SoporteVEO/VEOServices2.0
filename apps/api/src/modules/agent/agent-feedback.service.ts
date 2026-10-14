import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import { AgentLearningsService } from '../development/agent-learnings.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { distillLearning } from './agent-learning-distiller.js';
import {
  clipText,
  messageText,
  questionFor,
  toolCallsOf,
} from './agent-message-text.js';
import { isAgentConfigured } from './agent-model.js';
import { AgentThreadsService } from './agent-threads.service.js';
import type { AgentFeedbackBody } from './dto/agent-chat.schema.js';

const QUESTION_MAX_CHARS = 2_000;
const ANSWER_MAX_CHARS = 8_000;

const FEEDBACK_SELECT = {
  messageId: true,
  rating: true,
  reason: true,
  comment: true,
} as const;

@Injectable()
export class AgentFeedbackService {
  private readonly logger = new Logger(AgentFeedbackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly threads: AgentThreadsService,
    private readonly learnings: AgentLearningsService,
  ) {}

  forThread(userId: string, threadId: string) {
    return this.prisma.agentFeedback.findMany({
      where: { userId, threadId },
      select: FEEDBACK_SELECT,
    });
  }

  async rate(
    userId: string,
    threadId: string,
    messageId: string,
    body: AgentFeedbackBody,
  ) {
    const { messages } = await this.threads.get(userId, threadId);
    const index = messages.findIndex((m) => m.id === messageId);
    const message = messages[index];
    if (!message || message.role !== 'assistant') {
      throw new NotFoundException('Mensaje no encontrado');
    }

    const reason = body.rating === 'DISLIKE' ? (body.reason ?? null) : null;
    const comment = body.comment?.trim() || null;
    const key = { userId_messageId: { userId, messageId } };

    const previous = await this.prisma.agentFeedback.findUnique({
      where: key,
      select: FEEDBACK_SELECT,
    });
    const feedback = await this.prisma.agentFeedback.upsert({
      where: key,
      create: {
        userId,
        threadId,
        messageId,
        rating: body.rating,
        reason,
        comment,
        question: clipText(questionFor(messages, index), QUESTION_MAX_CHARS),
        answer: clipText(messageText(message), ANSWER_MAX_CHARS),
        toolCalls: toolCallsOf(message) as unknown as Prisma.InputJsonValue,
        model: (message.metadata as { model?: string } | undefined)?.model,
      },
      update: {
        rating: body.rating,
        reason,
        comment,
        review: 'PENDING',
        reviewedById: null,
        reviewedAt: null,
      },
      select: { id: true, ...FEEDBACK_SELECT },
    });

    const changed =
      !previous ||
      previous.rating !== feedback.rating ||
      previous.reason !== feedback.reason ||
      previous.comment !== feedback.comment;
    if (changed && worthLearning(messages, index, feedback.rating)) {
      void this.learnFrom(feedback, messages, index, userId, threadId);
    }

    return {
      messageId: feedback.messageId,
      rating: feedback.rating,
      reason: feedback.reason,
      comment: feedback.comment,
    };
  }

  async clear(userId: string, messageId: string) {
    const feedback = await this.prisma.agentFeedback.findUnique({
      where: { userId_messageId: { userId, messageId } },
      select: { id: true },
    });
    if (!feedback) return;
    await this.learnings.discardPendingFromFeedback(feedback.id);
    await this.prisma.agentFeedback.delete({ where: { id: feedback.id } });
  }

  private async learnFrom(
    feedback: {
      id: string;
      rating: AgentFeedbackBody['rating'];
      reason: AgentFeedbackBody['reason'] | null;
      comment: string | null;
    },
    messages: UIMessage[],
    ratedIndex: number,
    userId: string,
    threadId: string,
  ) {
    try {
      await this.learnings.discardPendingFromFeedback(feedback.id);
      const lesson = await distillLearning({
        messages,
        ratedIndex,
        rating: feedback.rating,
        reason: feedback.reason ?? null,
        comment: feedback.comment,
        knownLessons: await this.learnings.knownContents(),
      });
      if (!lesson) return;
      await this.learnings.propose({
        content: lesson,
        example: clipText(questionFor(messages, ratedIndex), 500) || undefined,
        source: 'FEEDBACK',
        feedbackId: feedback.id,
        threadId,
        proposedById: userId,
      });
    } catch (error) {
      this.logger.warn(
        `Could not distill a lesson from feedback ${feedback.id}: ${String(error)}`,
      );
    }
  }
}

/**
 * A dislike always may teach something. A like only does when the user had
 * to steer the conversation first, e.g. clarifying that a name is a client.
 */
function worthLearning(
  messages: UIMessage[],
  index: number,
  rating: AgentFeedbackBody['rating'],
): boolean {
  if (!isAgentConfigured()) return false;
  if (rating === 'DISLIKE') return true;
  const userTurns = messages
    .slice(0, index)
    .filter((m) => m.role === 'user').length;
  return userTurns >= 2;
}
