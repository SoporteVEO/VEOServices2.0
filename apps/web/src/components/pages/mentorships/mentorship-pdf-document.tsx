"use client";

import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { MentorshipSession } from "@/api/mentorships/mentorships.types";
import {
  DocFooter,
  DocHeader,
  DocSignatures,
  DocTitle,
} from "@/components/pages/my-space/document/veo-document-parts";
import {
  DOC_COLORS,
  docStyles as d,
} from "@/components/pages/my-space/document/veo-document-styles";
import { formatHumanDayDate, parseYYYYMMDD } from "@/lib/format";
import { registerDocumentFonts } from "@/lib/pdf-document-fonts";
import {
  FORM_CODE,
  MANUAL_CODE,
  formatDateTime,
  quarterLabel,
} from "./const";
import {
  AcknowledgementBox,
  CommitmentBox,
  KssTable,
  PreviousStartTable,
  SessionSummary,
} from "./mentorship-pdf-parts";
import { mentorshipStyles as s } from "./mentorship-pdf-styles";

registerDocumentFonts();

export function MentorshipPdfDocument({
  sessions,
  generatedAt = new Date(),
}: {
  sessions: MentorshipSession[];
  generatedAt?: Date;
}) {
  const subject = sessions[0]?.collaborator.name ?? "Colaborador";
  const footerNote = `${FORM_CODE} · CONFIDENCIAL · GENERADO EL ${formatDateTime(generatedAt.toISOString()).toUpperCase()}`;
  return (
    <Document
      title={`${FORM_CODE} Mentorías - ${subject}`}
      author="VEO Media"
      creator="VEO Media"
      subject="Registro de mentorías Keep / Stop / Start"
    >
      {sessions.map((session, index) => (
        <Page key={session.id} size="LETTER" style={d.page}>
          <DocHeader
            meta={formatHumanDayDate(parseYYYYMMDD(session.sessionDate))}
          />
          <DocTitle title={"REGISTRO DE\nMENTORÍA"} badge={FORM_CODE} />
          <Text style={s.intro}>
            Sesión{" "}
            <Text style={s.introStrong}>{`N.º ${session.sessionNumber}`}</Text>
            {` del ${quarterLabel(session.quarter)} · Retroalimentación Keep / Stop / Start según el manual ${MANUAL_CODE}.`}
          </Text>

          <SessionSummary session={session} />
          {session.previousStart ? (
            <PreviousStartTable previousStart={session.previousStart} />
          ) : null}
          <KssTable session={session} />
          <CommitmentBox session={session} />
          <AcknowledgementBox session={session} />

          <View style={d.spacer} />
          <DocSignatures
            signers={[
              { label: "JEFE DIRECTO:", name: session.mentor.name },
              { label: "COLABORADOR:", name: session.collaborator.name },
            ]}
          />
          <DocFooter
            note={footerNote}
            dotColor={
              index === sessions.length - 1 ? DOC_COLORS.lime : DOC_COLORS.ink
            }
          />
        </Page>
      ))}
    </Document>
  );
}
