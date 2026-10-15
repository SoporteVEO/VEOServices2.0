import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { z } from 'zod';
import { TEMPLATE_VARIABLE_KEYS } from '../crm/crm-template-render.js';
import { AGENT_NAME } from './agent-brand.js';
import { getMissingAgentApiKey, loadAgentModel } from './agent-model.js';
import { assertWithinRateLimit } from './agent-rate-limit.js';
import { loadAgentSdk } from './agent-sdk.js';
import { hasScope, type AgentUser } from './agent-scopes.js';
import type { AgentComposeBody } from './dto/agent-chat.schema.js';

const MAX_OUTPUT_TOKENS = 3000;

const draftSchema = z.object({
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email body in Markdown'),
});

export type AgentComposeDraft = z.infer<typeof draftSchema>;

const BASE_RULES = `You are ${AGENT_NAME}, the writing assistant of VEO, an out-of-home advertising company in El Salvador (static billboards, digital DOOH screens, production and installation). You write sales emails for VEO's sales team.

Rules:
- Neutral, professional and warm Spanish; short paragraphs; at most ~180 words unless asked otherwise.
- Markdown only for light formatting (bold, short lists). No headings, no images, no HTML.
- Never invent prices, dates, billboard codes, discounts or commitments.
- Do not add a signature block with phone numbers or titles; close with a short sign-off.
- If the current draft is given and the instruction asks to improve, shorten or change tone, edit that draft instead of starting over.`;

function templateInstructions() {
  return `${BASE_RULES}
- You are writing a reusable TEMPLATE. Personalize it with these variables (exact syntax, double braces) and no others: ${TEMPLATE_VARIABLE_KEYS.map((k) => `{{${k}}}`).join(', ')}.
- Use variables instead of concrete names, amounts or dates, and sign with {{asesor.nombre}}.
- The subject may use variables too.`;
}

function emailInstructions() {
  return `${BASE_RULES}
- You are writing ONE email for a real recipient. Use the context values given (contact, client, deal, campaign) literally; do not leave {{variables}} in the text.
- Omit any detail that is not in the context instead of inventing it.`;
}

@Injectable()
export class AgentComposeService {
  private readonly logger = new Logger(AgentComposeService.name);

  async compose(
    user: AgentUser,
    body: AgentComposeBody,
  ): Promise<AgentComposeDraft> {
    const missingKey = getMissingAgentApiKey();
    if (missingKey) {
      throw new ServiceUnavailableException(
        `${AGENT_NAME} no está configurado todavía (falta ${missingKey}).`,
      );
    }
    if (!hasScope(user, 'crm')) {
      throw new ForbiddenException(
        `Necesitas acceso al CRM para redactar con ${AGENT_NAME}.`,
      );
    }
    assertWithinRateLimit(user.id);

    const [{ ai }, { model }] = await Promise.all([
      loadAgentSdk(),
      loadAgentModel(),
    ]);
    const sender = [user.firstName, user.lastName].filter(Boolean).join(' ');
    const context = Object.entries(body.context ?? {})
      .filter(([, value]) => value.trim())
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n');

    const prompt = [
      `Instruction: ${body.instruction}`,
      `Sender: ${sender || user.email}`,
      context ? `Context:\n${context}` : null,
      body.current.subject || body.current.body
        ? `Current draft:\nSubject: ${body.current.subject}\n\n${body.current.body}`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const result = await ai.generateText({
        model,
        instructions:
          body.kind === 'crm_template'
            ? templateInstructions()
            : emailInstructions(),
        prompt,
        output: ai.Output.object({ schema: draftSchema }),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.5,
      });
      return {
        subject: result.output.subject.trim(),
        body: result.output.body.trim(),
      };
    } catch (error) {
      this.logger.error('[agent:compose]', error);
      throw new ServiceUnavailableException(
        `${AGENT_NAME} no pudo redactar el texto. Intenta de nuevo.`,
      );
    }
  }
}
