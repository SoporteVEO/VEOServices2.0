import type { AgentFeedbackReason } from "@/api/agent/agent.types";

export const FEEDBACK_REASON_ORDER: AgentFeedbackReason[] = [
  "MISUNDERSTOOD",
  "WRONG_DATA",
  "INCOMPLETE",
  "OTHER",
];

export const FEEDBACK_REASON_LABELS: Record<AgentFeedbackReason, string> = {
  MISUNDERSTOOD: "No entendió la pregunta",
  WRONG_DATA: "Datos incorrectos",
  INCOMPLETE: "Respuesta incompleta",
  OTHER: "Otro",
};
