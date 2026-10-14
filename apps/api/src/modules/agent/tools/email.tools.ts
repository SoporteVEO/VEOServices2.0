import { z } from 'zod';
import { buildAgentEmailHtml, buildExcelAttachment } from '../agent-email.js';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import {
  type AgentToolContext,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';
import { excelFileSchema } from './document-schemas.js';

export function buildEmailTools(ctx: AgentToolContext) {
  return {
    send_email: defineTool({
      description:
        'Sends an email from VEO Services. Always requires the user to approve it in the chat before sending. Can attach Excel files built from real data. Write subject and body in Spanish.',
      inputSchema: z.object({
        to: z.array(z.email()).min(1).max(10),
        subject: z.string().min(1).max(150),
        body: z
          .string()
          .min(1)
          .describe(
            'Plain text. Separate paragraphs with a blank line and use "- " for bullets.',
          ),
        excelAttachments: z.array(excelFileSchema).max(3).optional(),
      }),
      execute: async ({ to, subject, body, excelAttachments }) => {
        if (!hasScope(ctx.user, 'email')) return unauthorized('email');

        const senderName =
          [ctx.user.firstName, ctx.user.lastName].filter(Boolean).join(' ') ||
          ctx.user.email;
        const html = buildAgentEmailHtml({ subject, body, senderName });
        const attachments = (excelAttachments ?? []).map(buildExcelAttachment);

        const results = await Promise.all(
          to.map(async (recipient) => {
            const { error } = await ctx.email.sendEmail(
              recipient,
              subject,
              html,
              attachments,
            );
            return { recipient, ok: !error, error: error?.message ?? null };
          }),
        );

        return {
          ok: results.every((r) => r.ok),
          sent: results.filter((r) => r.ok).map((r) => r.recipient),
          failed: results.filter((r) => !r.ok),
          attachments: attachments.map((a) => a.filename),
          testInbox: process.env.NODE_ENV !== 'production',
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),
  };
}
