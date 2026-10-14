import type { AgentFeedbackReason, AgentFeedbackRating } from '@prisma/client';
import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import { z } from 'zod';
import { AGENT_NAME } from './agent-brand.js';
import { clipText, messageText, toolCallsOf } from './agent-message-text.js';
import { loadAgentModel } from './agent-model.js';
import { loadAgentSdk } from './agent-sdk.js';

const MESSAGES_BEFORE = 8;
const MESSAGES_AFTER = 2;
const MESSAGE_MAX_CHARS = 1_500;

const DISTILLER_PROMPT = `You curate the knowledge base of ${AGENT_NAME}, the AI assistant of VEO Services (out-of-home advertising in El Salvador). You receive a conversation and a user's rating of ONE assistant answer (marked >>> RATED <<<).

Extract at most ONE durable, generalizable lesson that would help ${AGENT_NAME} answer future questions from ANY user correctly the first time.

Good lessons:
- Business vocabulary and entities, e.g. "Publicidad Comercial, S.A. de C.V. es un cliente. Cuando pregunten por 'compras de Publicidad Comercial' se refiere a las ventas facturadas a ese cliente: usar get_sales_summary con customer."
- Which tool or data source answers a kind of question.
- How to interpret an ambiguous term in VEO's context.

Return lesson = null when:
- The only lesson would be a figure, total, date or status that changes over time.
- It is a one-off or personal preference.
- The conversation does not support the user's rating (users can be wrong; e.g. they disliked a correct answer).
- An existing lesson already covers it, or it would just restate generic advice ("ser más preciso").

Write the lesson in Spanish as a direct instruction for ${AGENT_NAME}, max 300 characters, naming entities exactly as they appear in the data when known.`;

const distillerSchema = z.object({
  lesson: z.string().max(400).nullable(),
  confidence: z.enum(['low', 'medium', 'high']),
});

export interface DistillInput {
  messages: UIMessage[];
  ratedIndex: number;
  rating: AgentFeedbackRating;
  reason: AgentFeedbackReason | null;
  comment: string | null;
  knownLessons: string[];
}

export async function distillLearning(
  input: DistillInput,
): Promise<string | null> {
  const [sdk, { model }] = await Promise.all([
    loadAgentSdk(),
    loadAgentModel(),
  ]);

  const { output } = await sdk.ai.generateText({
    model,
    instructions: DISTILLER_PROMPT,
    prompt: buildPrompt(input),
    output: sdk.ai.Output.object({ schema: distillerSchema }),
    temperature: 0,
    maxOutputTokens: 600,
  });

  const lesson = output.lesson?.trim();
  if (!lesson || output.confidence === 'low') return null;
  return lesson;
}

function buildPrompt({
  messages,
  ratedIndex,
  rating,
  reason,
  comment,
  knownLessons,
}: DistillInput): string {
  const start = Math.max(0, ratedIndex - MESSAGES_BEFORE);
  const end = Math.min(messages.length, ratedIndex + 1 + MESSAGES_AFTER);
  const transcript = messages
    .slice(start, end)
    .map((message, offset) => {
      const index = start + offset;
      const marker = index === ratedIndex ? '>>> RATED <<< ' : '';
      const tools = toolCallsOf(message)
        .map((call) => `  [tool] ${call.tool} ${call.input}`)
        .join('\n');
      const text = clipText(messageText(message), MESSAGE_MAX_CHARS);
      return `${marker}${message.role.toUpperCase()}:\n${[text, tools].filter(Boolean).join('\n')}`;
    })
    .join('\n\n');

  return `## Rating
- Rating: ${rating === 'LIKE' ? 'liked (answer was good)' : 'disliked (user says it was wrong)'}
- Reason: ${reason ?? 'not given'}
- User comment: ${comment?.trim() || 'none'}

## Existing lessons
${knownLessons.length ? knownLessons.map((l) => `- ${l}`).join('\n') : '- none'}

## Conversation
${transcript}`;
}
