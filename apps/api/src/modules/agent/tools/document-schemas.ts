import { z } from 'zod';

export const cellSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const columnSchema = z.object({
  key: z.string(),
  label: z.string(),
  format: z
    .enum(['text', 'number', 'currency', 'percent', 'date'])
    .optional()
    .describe('currency means USD'),
});

export const tableDataSchema = z.object({
  columns: z.array(columnSchema).min(1).max(20),
  rows: z.array(z.record(z.string(), cellSchema)).max(500),
});

export const pdfTableSchema = tableDataSchema.extend({
  totals: z
    .record(z.string(), cellSchema)
    .optional()
    .describe('Totals row keyed like the rows; leave non-summed keys out'),
});

export const pdfChartSchema = z.object({
  title: z.string().optional(),
  valueFormat: z.enum(['number', 'currency', 'percent']).optional(),
  data: z
    .array(z.object({ label: z.string(), value: z.number() }))
    .min(1)
    .max(15)
    .describe('Ranked automatically from highest to lowest'),
});

export const pdfHighlightSchema = z.object({
  label: z.string().describe('Short label, e.g. "Venta total"'),
  value: z.string().describe('Already formatted, e.g. "$281,831.18"'),
  detail: z.string().optional().describe('One short line of context'),
});

export const sheetSchema = tableDataSchema.extend({
  name: z.string().max(31).describe('Sheet name (max 31 characters)'),
});

export const excelFileSchema = z.object({
  fileName: z.string().describe('File name without extension'),
  sheets: z.array(sheetSchema).min(1).max(5),
});

export type ExcelFileSpec = z.infer<typeof excelFileSchema>;
