import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import { PrismaService } from '../prisma/prisma.service.js';

const THREAD_LIST_LIMIT = 50;
const TITLE_MAX_LENGTH = 80;

export interface AgentThreadSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AgentThreadsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<AgentThreadSummary[]> {
    return this.prisma.agentThread.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: THREAD_LIST_LIMIT,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async get(userId: string, id: string) {
    const thread = await this.prisma.agentThread.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { position: 'asc' } } },
    });
    if (!thread) throw new NotFoundException('Conversación no encontrada');
    return {
      id: thread.id,
      title: thread.title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      messages: thread.messages.map(toUIMessage),
    };
  }

  /** Returns the stored history, creating the thread on its first message. */
  async open(
    userId: string,
    id: string,
    firstMessage: UIMessage,
  ): Promise<UIMessage[]> {
    const existing = await this.prisma.agentThread.findUnique({
      where: { id },
      include: { messages: { orderBy: { position: 'asc' } } },
    });
    if (existing) {
      if (existing.userId !== userId) {
        throw new NotFoundException('Conversación no encontrada');
      }
      return existing.messages.map(toUIMessage);
    }
    await this.prisma.agentThread.create({
      data: { id, userId, title: titleFrom(firstMessage) },
    });
    return [];
  }

  async rename(userId: string, id: string, title: string) {
    const { count } = await this.prisma.agentThread.updateMany({
      where: { id, userId },
      data: {
        title: title.trim().slice(0, TITLE_MAX_LENGTH) || 'Conversación',
      },
    });
    if (count === 0) throw new NotFoundException('Conversación no encontrada');
  }

  async remove(userId: string, id: string) {
    const { count } = await this.prisma.agentThread.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Conversación no encontrada');
  }

  async saveMessages(threadId: string, messages: UIMessage[]) {
    await this.prisma.$transaction([
      this.prisma.agentMessage.deleteMany({ where: { threadId } }),
      this.prisma.agentMessage.createMany({
        data: messages.map((message, position) => ({
          id: message.id,
          threadId,
          position,
          role: message.role,
          parts: message.parts as unknown as Prisma.InputJsonValue,
          metadata: (message.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
        })),
      }),
      this.prisma.agentThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }
}

function toUIMessage(row: {
  id: string;
  role: string;
  parts: Prisma.JsonValue;
  metadata: Prisma.JsonValue | null;
}): UIMessage {
  return {
    id: row.id,
    role: row.role as UIMessage['role'],
    parts: row.parts as unknown as UIMessage['parts'],
    ...(row.metadata != null ? { metadata: row.metadata } : {}),
  };
}

function titleFrom(message: UIMessage): string {
  const text = message.parts
    .map((part) => (part.type === 'text' ? part.text : ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Nueva conversación';
  return text.length > TITLE_MAX_LENGTH
    ? `${text.slice(0, TITLE_MAX_LENGTH - 1)}…`
    : text;
}
