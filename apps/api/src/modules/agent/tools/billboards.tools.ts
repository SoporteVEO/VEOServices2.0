import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import { hasScope } from '../agent-scopes.js';
import {
  type AgentToolContext,
  toModelText,
  unauthorized,
} from './agent-tool-context.js';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato YYYY-MM-DD');

const IMAGE_TYPES = [
  'STATIC_BILLBOARD_MONTHLY',
  'STATIC_BILLBOARD_MAINTENANCE',
  'STATIC_BILLBOARD_INSTALLATION',
] as const;

interface BillboardListing {
  billboardId: number;
  billboardCode: string | null;
}

interface S3ImageItem {
  id: string;
  url: string;
  createdAt: string;
  type: (typeof IMAGE_TYPES)[number];
  staticBillboardCode: { code: string } | null;
  uploadedUser: { firstName: string; lastName: string | null };
}

export function buildBillboardTools(ctx: AgentToolContext) {
  return {
    generate_static_billboards_report: defineTool({
      description:
        'Prepares the static billboard availability report (the same PowerPoint deck as the "Generar reporte" button in the Vallas estáticas module). The chat shows a download button. If the user does not mention specific billboards, the report covers all billboards available in the range.',
      inputSchema: z.object({
        from: isoDate.describe('Start date (YYYY-MM-DD)'),
        to: isoDate.describe('End date (YYYY-MM-DD)'),
        billboardCodes: z
          .array(z.string())
          .optional()
          .describe('Billboard codes to limit the report, e.g. ["VE-3035"]'),
      }),
      execute: async ({ from, to, billboardCodes }) => {
        if (!hasScope(ctx.user, 'static_billboards')) {
          return unauthorized('static_billboards');
        }
        if (from > to) {
          return {
            ok: false,
            error: 'La fecha inicial es posterior a la final',
          };
        }

        let billboardIds: number[] | undefined;
        const missingCodes: string[] = [];
        if (billboardCodes?.length) {
          const listing = await ctx.api.request<{ data: BillboardListing[] }>({
            method: 'GET',
            path: '/billboards/available',
            query: { from, to, includeUnavailable: true },
          });
          if (!listing.ok) return { ok: false, error: listing.error };

          const byCode = new Map(
            (listing.data?.data ?? []).map((b) => [
              b.billboardCode?.toUpperCase(),
              b.billboardId,
            ]),
          );
          billboardIds = [];
          for (const code of billboardCodes) {
            const id = byCode.get(code.trim().toUpperCase());
            if (id != null) billboardIds.push(id);
            else missingCodes.push(code);
          }
        }

        const report = await ctx.api.request<{ data: BillboardListing[] }>({
          method: 'GET',
          path: '/billboards/available/report',
          query: { from, to, billboardIds: billboardIds?.join(',') },
        });
        if (!report.ok) return { ok: false, error: report.error };

        const rows = report.data?.data ?? [];
        return {
          ok: true,
          from,
          to,
          billboardIds,
          count: rows.length,
          codes: rows
            .map((b) => b.billboardCode)
            .filter(Boolean)
            .slice(0, 30) as string[],
          missingCodes,
        };
      },
      toModelOutput: ({ output }) => toModelText(output),
    }),

    get_billboard_images: defineTool({
      description:
        'Gets photos of a static billboard by its code (Imágenes module), most recent first. When the user asks for a specific day or period, pass from/to (inclusive; use the same date in both for a single day). The chat shows them in a gallery that can be expanded and downloaded.',
      inputSchema: z.object({
        code: z.string().describe('Billboard code, e.g. VE-3035'),
        limit: z.number().int().min(1).max(30).default(5),
        type: z.enum(IMAGE_TYPES).optional(),
        from: isoDate
          .optional()
          .describe('Only photos uploaded on or after this date (YYYY-MM-DD)'),
        to: isoDate
          .optional()
          .describe('Only photos uploaded on or before this date (YYYY-MM-DD)'),
      }),
      execute: async ({ code, limit, type, from, to }) => {
        if (!hasScope(ctx.user, 'images')) return unauthorized('images');
        if (from && to && from > to) {
          return {
            ok: false,
            error: 'La fecha inicial es posterior a la final',
          };
        }

        const response = await ctx.api.request<{ data: S3ImageItem[] }>({
          method: 'GET',
          path: '/s3-images',
          query: {
            code: code.trim(),
            type,
            dateFrom: from,
            dateTo: to,
            sortOrder: 'desc',
            limit: Math.min(limit * 3, 100),
          },
        });
        if (!response.ok) return { ok: false, error: response.error };

        const all = response.data?.data ?? [];
        const target = code.trim().toUpperCase();
        const exact = all.filter(
          (img) => img.staticBillboardCode?.code.toUpperCase() === target,
        );
        const images = (exact.length > 0 ? exact : all).slice(0, limit);

        return {
          ok: true,
          code,
          type: type ?? null,
          from: from ?? null,
          to: to ?? null,
          fetchedAt: new Date().toISOString(),
          images: images.map((img) => ({
            id: img.id,
            url: img.url,
            createdAt: img.createdAt,
            type: img.type,
            code: img.staticBillboardCode?.code ?? null,
            uploadedBy: [img.uploadedUser.firstName, img.uploadedUser.lastName]
              .filter(Boolean)
              .join(' '),
          })),
        };
      },
      toModelOutput: ({ output }) => {
        const images = 'images' in output ? output.images : undefined;
        if (!images) return toModelText(output);
        return toModelText({
          ...output,
          images: images.map((img) => ({
            id: img.id,
            createdAt: img.createdAt,
            type: img.type,
            code: img.code,
            uploadedBy: img.uploadedBy,
          })),
          note: 'Las imágenes ya se muestran al usuario en una galería.',
        });
      },
    }),
  };
}
