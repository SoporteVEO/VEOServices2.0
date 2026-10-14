import { z } from 'zod';

export const threadIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{8,64}$/, 'Identificador de conversación inválido');

export const agentChatBodySchema = z.object({
  id: threadIdSchema,
  message: z.object({
    id: z.string().min(1).max(128),
    role: z.enum(['user', 'assistant']),
    parts: z.array(z.record(z.string(), z.unknown())).min(1),
    metadata: z.unknown().optional(),
  }),
});

export const renameThreadSchema = z.object({
  title: z.string().min(1).max(120),
});

export const messageIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,128}$/, 'Identificador de mensaje inválido');

export const agentFeedbackBodySchema = z.object({
  rating: z.enum(['LIKE', 'DISLIKE']),
  reason: z
    .enum(['WRONG_DATA', 'MISUNDERSTOOD', 'INCOMPLETE', 'OTHER'])
    .optional(),
  comment: z.string().max(1000).optional(),
});

export type AgentChatBody = z.infer<typeof agentChatBodySchema>;
export type AgentFeedbackBody = z.infer<typeof agentFeedbackBodySchema>;
