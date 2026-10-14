import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { type AgentToolContext, toModelText } from './agent-tool-context.js';

export function buildLearningTools(ctx: AgentToolContext) {
  return {
    remember_learning: defineTool({
      description:
        'Saves a durable lesson after the user corrects how you interpreted a request, so future conversations get it right the first time. Use it when the correction is generalizable: a name you treated as a generic term is actually a client, supplier or billboard; a business term means something specific; a kind of question must be answered with a specific tool or filter. Do NOT use it for figures or dates that change over time, one-off preferences, or when tool data contradicts the user. The lesson applies right away to this user and to everyone after the dev team reviews it. Call it at most once per correction, then continue answering.',
      inputSchema: z.object({
        content: z
          .string()
          .min(15)
          .max(400)
          .describe(
            'The lesson in Spanish, as an instruction for yourself, e.g. "Publicidad Comercial, S.A. de C.V. es un cliente. \'Compras de Publicidad Comercial\' se refiere a las ventas facturadas a ese cliente: usar get_sales_summary con customer."',
          ),
      }),
      execute: async ({ content }) => {
        try {
          const { saved } = await ctx.rememberLearning(content);
          return { ok: true as const, saved };
        } catch {
          return { ok: false as const, error: 'No se pudo guardar' };
        }
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}
