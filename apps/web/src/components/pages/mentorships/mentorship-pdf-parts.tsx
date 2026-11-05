import type { ReactNode } from "react";
import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type {
  KssKind,
  MentorshipSession,
} from "@/api/mentorships/mentorships.types";
import { DocInfoCell } from "@/components/pages/my-space/document/veo-document-parts";
import {
  docStyles as d,
  px,
} from "@/components/pages/my-space/document/veo-document-styles";
import {
  KSS_ORDER,
  OUTCOME_LABELS,
  formatDateTime,
  formatDay,
} from "./const";
import { mentorshipStyles as s } from "./mentorship-pdf-styles";

type Column = { heading: string; width: string };

const KSS_COLUMNS: Column[] = [
  { heading: "Acuerdo", width: "18%" },
  { heading: "Qué", width: "20.5%" },
  { heading: "Cómo", width: "20.5%" },
  { heading: "Cuándo", width: "20.5%" },
  { heading: "Indicador", width: "20.5%" },
];

const PREVIOUS_START_COLUMNS: Column[] = [
  { heading: "Start comprometido", width: "46%" },
  { heading: "¿Cumplió?", width: "14%" },
  { heading: "Evidencia", width: "40%" },
];

const KSS_LABELS: Record<KssKind, { label: string; hint: string }> = {
  keep: { label: "KEEP", hint: "CONTINUAR" },
  stop: { label: "STOP", hint: "DEJAR DE HACER" },
  start: { label: "START", hint: "EMPEZAR A HACER" },
};

function orDash(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <View style={s.sectionTitle} minPresenceAhead={px(60)}>
      <View style={s.sectionTitleDot} />
      <Text style={s.sectionTitleText}>{children}</Text>
    </View>
  );
}

function TableHead({ columns }: { columns: Column[] }) {
  return (
    <View style={d.tableHeadRow} wrap={false}>
      {columns.map((column) => (
        <View key={column.heading} style={[d.th, { width: column.width }]}>
          <Text style={d.thText}>{column.heading}</Text>
        </View>
      ))}
    </View>
  );
}

function Td({
  width,
  style,
  children,
}: {
  width: string;
  style?: Style;
  children: ReactNode;
}) {
  return (
    <View style={[d.td, { width }]}>
      {typeof children === "string" ? (
        <Text style={style ?? s.tdText}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

export function SessionSummary({ session }: { session: MentorshipSession }) {
  return (
    <View style={d.infoGrid} wrap={false}>
      <View style={d.infoRow}>
        <DocInfoCell
          label="COLABORADOR:"
          value={session.collaborator.name}
          valueStyle={s.infoValue}
        />
        <DocInfoCell
          label="CARGO:"
          value={orDash(session.collaborator.position)}
          valueStyle={s.infoValue}
        />
        <DocInfoCell
          label="ÁREA/GERENCIA:"
          value={orDash(session.collaborator.department)}
          valueStyle={s.infoValue}
        />
      </View>
      <View style={d.infoRow}>
        <DocInfoCell
          label="JEFE DIRECTO:"
          value={session.mentor.name}
          valueStyle={s.infoValue}
        />
        <DocInfoCell
          label="FECHA DE LA SESIÓN:"
          value={formatDay(session.sessionDate)}
          valueStyle={s.infoValue}
        />
        <DocInfoCell
          label="PRÓXIMO SEGUIMIENTO:"
          value={formatDay(session.nextFollowUpDate)}
          valueStyle={s.infoValueHighlight}
          highlight
        />
      </View>
    </View>
  );
}

export function PreviousStartTable({
  previousStart,
}: {
  previousStart: NonNullable<MentorshipSession["previousStart"]>;
}) {
  const [what, outcome, evidence] = PREVIOUS_START_COLUMNS;
  return (
    <>
      <SectionTitle>
        {`SEGUIMIENTO DEL START ANTERIOR · SESIÓN N.º ${previousStart.sessionNumber}`}
      </SectionTitle>
      <View style={s.table}>
        <TableHead columns={PREVIOUS_START_COLUMNS} />
        <View style={d.tableRow} wrap={false}>
          <Td width={what.width}>{previousStart.what}</Td>
          <Td width={outcome.width} style={s.outcome}>
            {previousStart.outcome
              ? OUTCOME_LABELS[previousStart.outcome]
              : "—"}
          </Td>
          <Td width={evidence.width}>{orDash(previousStart.evidence)}</Td>
        </View>
      </View>
    </>
  );
}

export function KssTable({ session }: { session: MentorshipSession }) {
  const [label, ...fields] = KSS_COLUMNS;
  return (
    <>
      <SectionTitle>ACUERDOS KEEP / STOP / START</SectionTitle>
      <View style={s.table}>
        <TableHead columns={KSS_COLUMNS} />
        {KSS_ORDER.map((kind) => {
          const item = session[kind];
          const values = [item.what, item.how, item.when, item.indicator];
          return (
            <View key={kind} style={d.tableRow} wrap={false}>
              <Td width={label.width}>
                <Text style={s.kssLabel}>{KSS_LABELS[kind].label}</Text>
                <Text style={s.kssHint}>{KSS_LABELS[kind].hint}</Text>
              </Td>
              {fields.map((column, index) => (
                <Td key={column.heading} width={column.width}>
                  {values[index]}
                </Td>
              ))}
            </View>
          );
        })}
      </View>
    </>
  );
}

export function CommitmentBox({ session }: { session: MentorshipSession }) {
  return (
    <>
      <SectionTitle>COMPROMISO DEL COLABORADOR</SectionTitle>
      <View style={s.box} wrap={false}>
        <Text style={s.boxText}>{session.commitment}</Text>
      </View>
    </>
  );
}

export function AcknowledgementBox({
  session,
}: {
  session: MentorshipSession;
}) {
  return (
    <>
      <SectionTitle>CONFIRMACIÓN DE RECIBIDO</SectionTitle>
      <View style={s.box} wrap={false}>
        <Text style={s.boxNote}>
          {session.acknowledgedAt
            ? `CONFIRMADA POR EL COLABORADOR EL ${formatDateTime(session.acknowledgedAt).toUpperCase()}`
            : "PENDIENTE DE CONFIRMACIÓN POR EL COLABORADOR"}
        </Text>
        {session.acknowledgementComment ? (
          <Text style={s.boxComment}>
            {`“${session.acknowledgementComment}”`}
          </Text>
        ) : null}
      </View>
    </>
  );
}
