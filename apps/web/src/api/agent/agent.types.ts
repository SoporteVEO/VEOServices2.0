import type { UIDataTypes, UIMessage } from "ai";
import type { S3ImageType } from "@/api/s3-images/s3-images.get";

export type AgentCell = string | number | boolean | null;

export type AgentColumnFormat =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date";

export interface AgentColumn {
  key: string;
  label: string;
  format?: AgentColumnFormat;
}

export interface AgentTableData {
  columns: AgentColumn[];
  rows: Record<string, AgentCell>[];
}

export interface AgentTableInput extends AgentTableData {
  title: string;
  description?: string;
}

export interface AgentChartInput {
  title: string;
  description?: string;
  type: "bar" | "line" | "area" | "pie";
  xKey: string;
  series: { key: string; label: string }[];
  data: Record<string, AgentCell>[];
  valueFormat?: "number" | "currency" | "percent";
}

export interface AgentExcelInput {
  fileName: string;
  sheets: (AgentTableData & { name: string })[];
}

export interface AgentPdfTable extends AgentTableData {
  totals?: Record<string, AgentCell>;
}

export interface AgentPdfChart {
  title?: string;
  valueFormat?: "number" | "currency" | "percent";
  data: { label: string; value: number }[];
}

export interface AgentPdfHighlight {
  label: string;
  value: string;
  detail?: string;
}

export interface AgentPdfSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  chart?: AgentPdfChart;
  table?: AgentPdfTable;
}

export interface AgentPdfInput {
  fileName: string;
  title: string;
  subtitle?: string;
  orientation?: "portrait" | "landscape";
  highlights?: AgentPdfHighlight[];
  sections: AgentPdfSection[];
}

export interface AgentUnauthorized {
  ok: false;
  unauthorized: true;
  message: string;
}

export interface AgentToolError {
  ok: false;
  error: string | null;
}

export interface AgentReportOutput {
  ok: true;
  from: string;
  to: string;
  billboardIds?: number[];
  count: number;
  codes: string[];
  missingCodes: string[];
}

export interface AgentMonthlyReportContract {
  contractNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  description: string | null;
  endDate: string;
  totalBillboards: number;
  billboardsWithImages: number;
  totalImages: number;
  reportsSendedCount: number;
  billboardCodes: string[];
}

export interface AgentMonthlyReportOutput {
  ok: true;
  month: string;
  search: string;
  total: number;
  note?: string;
  contracts: AgentMonthlyReportContract[];
}

export interface AgentImage {
  id: string;
  url: string;
  createdAt: string;
  type: S3ImageType;
  code: string | null;
  uploadedBy: string;
}

export interface AgentImagesOutput {
  ok: true;
  code: string;
  type: S3ImageType | null;
  fetchedAt: string;
  images: AgentImage[];
}

export interface AgentEmailInput {
  to: string[];
  subject: string;
  body: string;
  excelAttachments?: AgentExcelInput[];
}

export interface AgentEmailOutput {
  ok: boolean;
  sent: string[];
  failed: { recipient: string; error: string | null }[];
  attachments: string[];
  testInbox: boolean;
}

export interface AgentCallApiInput {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean>;
  body?: Record<string, unknown>;
}

export interface AgentCallApiOutput {
  ok: boolean;
  status?: number;
  endpoint?: string;
  data?: unknown;
  error?: string | null;
}

export interface AgentIssueReportInput {
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  userRequest: string;
  technicalDetails: string;
  stepsToReproduce: string[];
  expectedBehavior?: string;
}

export interface AgentIssueReportOutput {
  ok: true;
  ticket: string;
  title: string;
}

export interface AgentResearchOutput {
  ok: true;
  company: string;
  focus: string | null;
  researchedAt: string;
  summary: string;
  sources: { title: string; url: string }[];
}

export interface AgentInventoryBillboard {
  code: string | null;
  address: string | null;
  reference: string | null;
  city: string | null;
  department: string | null;
  size: string | null;
  monthlyPrice: number | null;
  available: boolean;
  monthsWithoutPurchase: number | null;
  lat: number | null;
  lng: number | null;
}

export interface AgentInventoryInput {
  from: string;
  to: string;
  department?: string;
  city?: string;
  keywords?: string[];
  maxPrice?: number;
  includeOccupied?: boolean;
  limit?: number;
}

export interface AgentInventoryOutput {
  ok: true;
  from: string;
  to: string;
  inventorySize: number;
  matched: number;
  billboards: AgentInventoryBillboard[];
  note?: string;
}

export interface AgentProposalInput {
  company: string;
  contact?: { name?: string; role?: string; email?: string };
  objective: string;
  from: string;
  to: string;
  brandSummary: string;
  audience?: string;
  strategy: string[];
  billboards: { code: string; reason: string }[];
}

export interface AgentProposalOutput {
  ok: true;
  company: string;
  from: string;
  to: string;
  billboardIds: number[];
  included: {
    code: string;
    billboardId: number;
    city: string | null;
    monthlyPrice: number | null;
  }[];
  occupiedCodes: string[];
  missingCodes: string[];
  monthlyInvestment: number;
  preparedBy: string;
  preparedByEmail: string;
  createdAt: string;
}

export interface AgentTemplateDraftInput {
  name: string;
  subject: string;
  category?: string;
  body: string;
}

export interface AgentOpportunityInput {
  client: {
    id?: string;
    name: string;
    company?: string;
    email?: string;
    type?: "DIRECT" | "AGENCY";
  };
  contact?: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
  };
  deal: {
    title: string;
    description?: string;
    brand?: string;
    industry?: string;
    from: string;
    to: string;
    targetZones?: string[];
  };
  billboardCodes?: string[];
  hold?: boolean;
  stageName?: string;
}

export interface AgentOpportunityOutput {
  ok: true;
  deal: {
    id: string;
    title: string;
    pipeline: string;
    stage: string;
    value: number;
  };
  client: { id: string; name: string; created: boolean };
  contact: { id: string; name: string; created: boolean } | null;
  sitesAdded: number;
  sitesHeld: number;
  warnings: string[];
}

export type AgentBriloWriteMethod = "POST" | "PUT" | "DELETE";

export interface AgentBriloChange {
  record: string;
  field: string;
  before?: string;
  after?: string;
}

export interface AgentBriloChangeInput {
  title: string;
  explanation: string;
  changes: AgentBriloChange[];
  warnings?: string[];
  method: AgentBriloWriteMethod;
  path: string;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
}

export interface AgentBriloResult {
  ok: true;
  endpoint: string;
  total?: number;
  data: unknown;
}

type ToolResult<T> = T | AgentUnauthorized | AgentToolError;

export type AgentUITools = {
  show_table: {
    input: AgentTableInput;
    output: { ok: true; rowCount: number };
  };
  show_chart: { input: AgentChartInput; output: { ok: true; points: number } };
  create_excel_file: { input: AgentExcelInput; output: { ok: true } };
  create_pdf_document: { input: AgentPdfInput; output: { ok: true } };
  generate_static_billboards_report: {
    input: { from: string; to: string; billboardCodes?: string[] };
    output: ToolResult<AgentReportOutput>;
  };
  generate_monthly_report: {
    input: { month: string; search: string };
    output: ToolResult<AgentMonthlyReportOutput>;
  };
  get_billboard_images: {
    input: { code: string; limit?: number; type?: S3ImageType };
    output: ToolResult<AgentImagesOutput>;
  };
  send_email: { input: AgentEmailInput; output: ToolResult<AgentEmailOutput> };
  call_api: {
    input: AgentCallApiInput;
    output: AgentCallApiOutput | AgentUnauthorized;
  };
  list_api_endpoints: {
    input: { scope?: string; search?: string };
    output: { count: number };
  };
  report_issue: {
    input: AgentIssueReportInput;
    output: AgentIssueReportOutput | AgentToolError;
  };
  remember_learning: {
    input: { content: string };
    output: { ok: true; saved: boolean } | AgentToolError;
  };
  ask_data_source: {
    input: { topic: string };
    output: { source: AgentDataSource };
  };
  search_academy: {
    input: { query: string };
    output: { results: { slug: string; title: string; url: string }[] };
  };
  get_academy_article: {
    input: { slug: string };
    output: { ok: true; title: string; url: string } | AgentToolError;
  };
  research_company: {
    input: { company: string; focus?: string };
    output: ToolResult<AgentResearchOutput>;
  };
  search_billboard_inventory: {
    input: AgentInventoryInput;
    output: ToolResult<AgentInventoryOutput>;
  };
  create_client_proposal: {
    input: AgentProposalInput;
    output: ToolResult<AgentProposalOutput>;
  };
  draft_crm_template: {
    input: AgentTemplateDraftInput;
    output: { ok: true } | AgentUnauthorized;
  };
  register_crm_opportunity: {
    input: AgentOpportunityInput;
    output: ToolResult<AgentOpportunityOutput>;
  };
  brilo_api_search: {
    input: { query?: string; module?: string; method?: string };
    output: ToolResult<{ ok: true; count?: number }>;
  };
  brilo_api_describe: {
    input: { endpoint?: string; model?: string };
    output: ToolResult<{ ok: true; endpoint?: string }>;
  };
  brilo_api_get: {
    input: { path: string; query?: Record<string, string | number | boolean> };
    output: ToolResult<AgentBriloResult>;
  };
  brilo_api_change: {
    input: AgentBriloChangeInput;
    output: ToolResult<AgentBriloResult>;
  };
};

export interface AgentComposeRequest {
  kind: "crm_template" | "crm_email";
  instruction: string;
  current?: { subject: string; body: string };
  context?: Record<string, string>;
}

export interface AgentComposeDraft {
  subject: string;
  body: string;
}

export type AgentDataSource = "VEO" | "BRILO";

export interface AgentMessageMetadata {
  createdAt?: number;
  model?: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedInputTokens?: number;
  };
}

export type AgentUIMessage = UIMessage<
  AgentMessageMetadata,
  UIDataTypes,
  AgentUITools
>;

export type AgentMessagePart = AgentUIMessage["parts"][number];

export interface AgentThreadSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentThreadDetail extends AgentThreadSummary {
  messages: AgentUIMessage[];
}

export type AgentFeedbackRating = "LIKE" | "DISLIKE";

export type AgentFeedbackReason =
  | "WRONG_DATA"
  | "MISUNDERSTOOD"
  | "INCOMPLETE"
  | "OTHER";

export interface AgentMessageFeedback {
  messageId: string;
  rating: AgentFeedbackRating;
  reason: AgentFeedbackReason | null;
  comment: string | null;
}

export interface AgentCapabilities {
  enabled: boolean;
  role: string;
  scopes: { key: string; label: string }[];
}

export function isUnauthorized(output: unknown): output is AgentUnauthorized {
  return (
    typeof output === "object" &&
    output !== null &&
    (output as { unauthorized?: unknown }).unauthorized === true
  );
}

export function isToolError(output: unknown): output is AgentToolError {
  return (
    typeof output === "object" &&
    output !== null &&
    (output as { ok?: unknown }).ok === false
  );
}
