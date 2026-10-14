import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';

const DATA_SOURCES = ['VEO', 'BRILO'] as const;

/**
 * Answered in the chat UI: the user picks a source and the client sends it
 * back as the tool output, so there is no `execute`.
 */
export function buildDataSourceTools() {
  return {
    ask_data_source: defineTool({
      description:
        'Asks the user whether to get the data from the VEO Services platform or from the Brilo ERP, shown as two buttons in the chat. Use it when the requested data exists in both systems (e.g. quotes/offers, clients) and the user has not said which one to use. Call it before any other data tool and write nothing else in that turn; the conversation continues once the user picks.',
      inputSchema: z.object({
        topic: z
          .string()
          .min(3)
          .max(80)
          .describe(
            'What the user asked for, in Spanish and lowercase, e.g. "tus cotizaciones"',
          ),
      }),
      outputSchema: z.object({ source: z.enum(DATA_SOURCES) }),
    }),
  };
}
