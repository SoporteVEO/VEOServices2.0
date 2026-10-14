import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { type AgentToolContext, toModelText } from './agent-tool-context.js';

export function buildIssueTools(ctx: AgentToolContext) {
  return {
    report_issue: defineTool({
      description:
        'Files a bug ticket for the VEO dev team and returns its ticket number. Use it when something fails on our side: a tool error, an endpoint returning 5xx or an exception, or data that is clearly broken or inconsistent. Do NOT use it for permission denials, invalid user input, or legitimately empty results. The server attaches the raw diagnostics (every tool call with its input/output, errors, stack traces, failed HTTP requests and the recent conversation) automatically, so focus on your analysis. Write every field in Spanish.',
      inputSchema: z.object({
        title: z
          .string()
          .min(5)
          .max(140)
          .describe(
            'Short title, e.g. "Error al obtener imágenes de instalación de VS-2077"',
          ),
        severity: z
          .enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
          .describe(
            'CRITICAL: Nexo or the platform is unusable. HIGH: a feature fails with no workaround. MEDIUM: partial failure or a workaround exists. LOW: cosmetic or minor.',
          ),
        summary: z
          .string()
          .min(10)
          .max(2000)
          .describe('What the user wanted, what you did and what went wrong.'),
        userRequest: z
          .string()
          .min(1)
          .max(2000)
          .describe("The user's original request, verbatim."),
        technicalDetails: z
          .string()
          .min(10)
          .max(8000)
          .describe(
            'For developers: each tool call involved (name, exact input, exact error or response), what you retried or tried instead, and your hypothesis of the root cause.',
          ),
        stepsToReproduce: z
          .array(z.string().min(1).max(500))
          .min(1)
          .max(15)
          .describe('Concrete steps a developer can follow to reproduce it.'),
        expectedBehavior: z
          .string()
          .max(1000)
          .optional()
          .describe('What should have happened.'),
      }),
      execute: async (report) => {
        try {
          const { ticket } = await ctx.reportIssue(report);
          return { ok: true as const, ticket, title: report.title };
        } catch {
          return {
            ok: false as const,
            error: 'No se pudo registrar el ticket',
          };
        }
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}
