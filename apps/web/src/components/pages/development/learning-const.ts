import type {
  AgentFeedbackReview,
  AgentLearningSource,
  AgentLearningStatus,
} from "@/api/development/agent-learnings.types";

export const LEARNING_STATUS_ORDER: AgentLearningStatus[] = [
  "PENDING",
  "ACTIVE",
  "REJECTED",
];

export const LEARNING_STATUS_LABELS: Record<AgentLearningStatus, string> = {
  PENDING: "Por revisar",
  ACTIVE: "Activo",
  REJECTED: "Rechazado",
};

export const LEARNING_STATUS_TAB_LABELS: Record<AgentLearningStatus, string> =
  {
    PENDING: "Por revisar",
    ACTIVE: "Activos",
    REJECTED: "Rechazados",
  };

export const LEARNING_STATUS_STYLES: Record<AgentLearningStatus, string> = {
  PENDING:
    "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACTIVE:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

export const LEARNING_SOURCE_LABELS: Record<AgentLearningSource, string> = {
  FEEDBACK: "Calificación",
  CONVERSATION: "Corrección en chat",
  MANUAL: "Manual",
};

export const FEEDBACK_REVIEW_ORDER: AgentFeedbackReview[] = [
  "PENDING",
  "CONFIRMED",
  "DISMISSED",
];

export const FEEDBACK_REVIEW_LABELS: Record<AgentFeedbackReview, string> = {
  PENDING: "Sin revisar",
  CONFIRMED: "Usuario tiene razón",
  DISMISSED: "Usuario se equivocó",
};

export const FEEDBACK_REVIEW_TAB_LABELS: Record<AgentFeedbackReview, string> =
  {
    PENDING: "Sin revisar",
    CONFIRMED: "Confirmadas",
    DISMISSED: "Descartadas",
  };

export const FEEDBACK_REVIEW_STYLES: Record<AgentFeedbackReview, string> = {
  PENDING: "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  CONFIRMED:
    "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  DISMISSED:
    "border-slate-500/40 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};
