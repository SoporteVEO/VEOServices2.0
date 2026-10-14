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

export type AgentChatBody = z.infer<typeof agentChatBodySchema>;
