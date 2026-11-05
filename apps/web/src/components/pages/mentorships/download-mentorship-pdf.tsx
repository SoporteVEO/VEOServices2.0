"use client";

import { pdf } from "@react-pdf/renderer";
import type { MentorshipSession } from "@/api/mentorships/mentorships.types";
import { downloadBlob, safeFileName } from "@/lib/pdf-download";
import { FORM_CODE } from "./const";
import { MentorshipPdfDocument } from "./mentorship-pdf-document";

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/** One page per session, oldest first, in the VEO-FOR-03 layout. */
export async function downloadMentorshipPdf(sessions: MentorshipSession[]) {
  if (sessions.length === 0) return;
  const ordered = [...sessions].sort(
    (a, b) => a.sessionNumber - b.sessionNumber,
  );
  const blob = await pdf(
    <MentorshipPdfDocument sessions={ordered} />,
  ).toBlob();
  const name = slug(ordered[0].collaborator.name);
  const suffix =
    ordered.length === 1 ? `sesion-${ordered[0].sessionNumber}` : "historial";
  downloadBlob(blob, safeFileName(`${FORM_CODE}-${name}-${suffix}.pdf`));
}
