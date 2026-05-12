import { renderToBuffer } from '@react-pdf/renderer';
import {
  AbsencePdfReport,
  type AbsenceInput,
  type AbsencePdfImage,
} from './absence-pdf-report.js';

export type { AbsenceInput, AbsencePdfImage };

export interface BuildAbsencePdfInput {
  absence: AbsenceInput;
  images?: AbsencePdfImage[];
  generatedAt?: Date;
}

/**
 * Renders the AbsencePdfReport React component to a PDF Buffer using
 * @react-pdf/renderer. The output is byte-identical to the PDF produced
 * by the web app's "Descargar reporte" button (apps/web/src/components/pages/rh/absence-pdf-report.tsx).
 */
export async function buildAbsencePdf(
  input: BuildAbsencePdfInput,
): Promise<Buffer> {
  const element = (
    <AbsencePdfReport
      absence={input.absence}
      images={input.images}
      generatedAt={input.generatedAt}
    />
  );
  return renderToBuffer(element);
}
