import { z } from 'zod';
import { TEMPLATE_VARIABLE_KEYS } from '../../crm/crm-template-render.js';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import { type AgentToolContext, unauthorized } from './agent-tool-context.js';

const VARIABLES = TEMPLATE_VARIABLE_KEYS.map((key) => `{{${key}}}`).join(', ');

export function buildCrmTools(ctx: AgentToolContext) {
  return {
    draft_crm_template: defineTool({
      description: `Drafts a reusable CRM email template (Plantillas module) and shows it in the chat with a preview and a "Guardar plantilla" button, so the user reviews it before it is saved. Use it whenever the user asks to create, write or improve a plantilla. Write the body in Markdown, in Spanish, warm and professional, short paragraphs, VEO tone (out-of-home advertising in El Salvador). Personalize with these variables only: ${VARIABLES}. Never invent prices, dates or billboard codes: use the variables instead.`,
      inputSchema: z.object({
        name: z.string().min(2).max(100).describe('Template name'),
        subject: z.string().min(1).max(200),
        category: z
          .string()
          .max(50)
          .optional()
          .describe('e.g. "Seguimiento", "Propuesta", "Renovación"'),
        body: z.string().min(20).max(8000).describe('Markdown body'),
      }),
      execute: () => {
        if (!hasScope(ctx.user, 'crm')) return unauthorized('crm');
        return { ok: true as const };
      },
      toModelOutput: () => ({
        type: 'text' as const,
        value:
          'El borrador ya se muestra al usuario con vista previa y el botón para guardarlo. No repitas el contenido; pregunta si quiere ajustar algo.',
      }),
    }),
  };
}
