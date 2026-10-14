import type {
  AgentFeedbackRating,
  AgentFeedbackReason,
} from "@/api/agent/agent.types";
import type { AgentIssueUser } from "./agent-issues.types";

export type AgentLearningStatus = "PENDING" | "ACTIVE" | "REJECTED";

export type AgentLearningSource = "FEEDBACK" | "CONVERSATION" | "MANUAL";

export type AgentFeedbackReview = "PENDING" | "CONFIRMED" | "DISMISSED";

export type AgentLearning = {
  id: string;
  content: string;
  example: string | null;
  status: AgentLearningStatus;
  source: AgentLearningSource;
  threadId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  proposedBy: AgentIssueUser | null;
  reviewedBy: AgentIssueUser | null;
  feedback: {
    id: string;
    rating: AgentFeedbackRating;
    reason: AgentFeedbackReason | null;
    question: string;
  } | null;
};

export type PaginatedAgentLearnings = {
  data: AgentLearning[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<AgentLearningStatus, number>;
};

export type CreateAgentLearningInput = {
  content: string;
  example?: string;
};

export type UpdateAgentLearningInput = {
  content?: string;
  status?: AgentLearningStatus;
};

export type AgentFeedbackListItem = {
  id: string;
  rating: AgentFeedbackRating;
  reason: AgentFeedbackReason | null;
  comment: string | null;
  question: string;
  review: AgentFeedbackReview;
  createdAt: string;
  updatedAt: string;
  user: AgentIssueUser | null;
  learningCount: number;
};

export type AgentFeedbackToolCall = { tool: string; input: string };

export type AgentFeedbackDetail = Omit<AgentFeedbackListItem, "learningCount"> & {
  threadId: string;
  messageId: string;
  answer: string;
  toolCalls: AgentFeedbackToolCall[];
  model: string | null;
  reviewedAt: string | null;
  reviewedBy: AgentIssueUser | null;
  learnings: {
    id: string;
    content: string;
    status: AgentLearningStatus;
    createdAt: string;
  }[];
};

export type PaginatedAgentFeedback = {
  data: AgentFeedbackListItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<AgentFeedbackReview, number>;
};
