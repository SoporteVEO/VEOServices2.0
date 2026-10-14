import { z } from 'zod';
import { defineTool } from '../agent-sdk.js';
import {
  cellSchema,
  excelFileSchema,
  pdfChartSchema,
  pdfHighlightSchema,
  pdfTableSchema,
  tableDataSchema,
} from './document-schemas.js';

const SHOWN = (what: string) => ({
  type: 'text' as const,
  value: `${what} ya se muestra al usuario en el chat. No repitas su contenido; resume solo lo relevante.`,
});

export function buildDocumentTools() {
  return {
    show_table: defineTool({
      description:
        'Shows a table in the chat using the app components. The user can export it to Excel or PDF from the table. Use real data obtained with other tools. Column labels and titles in Spanish.',
      inputSchema: tableDataSchema.extend({
        title: z.string(),
        description: z.string().optional(),
      }),
      execute: ({ rows }) => ({ ok: true, rowCount: rows.length }),
      toModelOutput: () => SHOWN('La tabla'),
    }),

    show_chart: defineTool({
      description:
        'Shows a chart in the chat (bar, line, area or pie) using the app chart components. Titles and labels in Spanish.',
      inputSchema: z.object({
        title: z.string(),
        description: z.string().optional(),
        type: z.enum(['bar', 'line', 'area', 'pie']),
        xKey: z.string().describe('Data key for the category / X axis'),
        series: z
          .array(z.object({ key: z.string(), label: z.string() }))
          .min(1)
          .max(6)
          .describe('Use a single series for pie charts'),
        data: z.array(z.record(z.string(), cellSchema)).min(1).max(200),
        valueFormat: z.enum(['number', 'currency', 'percent']).optional(),
      }),
      execute: ({ data }) => ({ ok: true, points: data.length }),
      toModelOutput: () => SHOWN('La gráfica'),
    }),

    create_excel_file: defineTool({
      description:
        'Generates a downloadable Excel file (.xlsx) with one or more sheets.',
      inputSchema: excelFileSchema,
      execute: ({ fileName, sheets }) => ({
        ok: true,
        fileName,
        sheets: sheets.map((s) => ({ name: s.name, rows: s.rows.length })),
      }),
      toModelOutput: () => SHOWN('El botón de descarga del Excel'),
    }),

    create_pdf_document: defineTool({
      description:
        'Generates a downloadable PDF with the VEO brand (logo, palette and typography are applied automatically; never describe colors or styling). Put the 2-4 key figures in highlights, use a section chart for rankings or distributions (e.g. sales by cost center) next to its detail table, and add a totals row to tables that sum. Keep paragraphs short and factual. Content in Spanish.',
      inputSchema: z.object({
        fileName: z.string().describe('File name without extension'),
        title: z.string(),
        subtitle: z
          .string()
          .optional()
          .describe('Period or scope, e.g. "Septiembre 2026"'),
        orientation: z.enum(['portrait', 'landscape']).default('portrait'),
        highlights: z
          .array(pdfHighlightSchema)
          .max(4)
          .optional()
          .describe('Key figure cards under the title; the first is featured'),
        sections: z
          .array(
            z.object({
              heading: z.string().optional(),
              paragraphs: z.array(z.string()).optional(),
              bullets: z.array(z.string()).optional(),
              chart: pdfChartSchema.optional(),
              table: pdfTableSchema.optional(),
            }),
          )
          .min(1)
          .max(30),
      }),
      execute: ({ fileName, sections }) => ({
        ok: true,
        fileName,
        sections: sections.length,
      }),
      toModelOutput: () => SHOWN('El botón de descarga del PDF'),
    }),
  };
}
