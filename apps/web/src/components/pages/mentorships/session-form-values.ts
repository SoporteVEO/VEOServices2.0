import type {
  KssItem,
  MentorshipSession,
  MentorshipSessionInput,
  MentorshipStartOutcome,
} from "@/api/mentorships/mentorships.types";

export type SessionFormValues = {
  sessionDate: string;
  nextFollowUpDate: string;
  previousStartOutcome: MentorshipStartOutcome | "";
  previousStartEvidence: string;
  keep: KssItem;
  stop: KssItem;
  start: KssItem;
  commitment: string;
  reason: string;
};

const EMPTY_KSS: KssItem = { what: "", how: "", when: "", indicator: "" };

export function emptySessionValues(sessionDate: string): SessionFormValues {
  return {
    sessionDate,
    nextFollowUpDate: "",
    previousStartOutcome: "",
    previousStartEvidence: "",
    keep: { ...EMPTY_KSS },
    stop: { ...EMPTY_KSS },
    start: { ...EMPTY_KSS },
    commitment: "",
    reason: "",
  };
}

export function sessionToValues(session: MentorshipSession): SessionFormValues {
  return {
    sessionDate: session.sessionDate,
    nextFollowUpDate: session.nextFollowUpDate,
    previousStartOutcome: session.previousStart?.outcome ?? "",
    previousStartEvidence: session.previousStart?.evidence ?? "",
    keep: { ...session.keep },
    stop: { ...session.stop },
    start: { ...session.start },
    commitment: session.commitment,
    reason: "",
  };
}

function trimKss(item: KssItem): KssItem {
  return {
    what: item.what.trim(),
    how: item.how.trim(),
    when: item.when.trim(),
    indicator: item.indicator.trim(),
  };
}

export function valuesToInput(
  values: SessionFormValues,
  hasPreviousStart: boolean,
): MentorshipSessionInput {
  return {
    sessionDate: values.sessionDate,
    nextFollowUpDate: values.nextFollowUpDate,
    ...(hasPreviousStart && values.previousStartOutcome
      ? {
          previousStartOutcome: values.previousStartOutcome,
          previousStartEvidence: values.previousStartEvidence.trim(),
        }
      : {}),
    keep: trimKss(values.keep),
    stop: trimKss(values.stop),
    start: trimKss(values.start),
    commitment: values.commitment.trim(),
  };
}
