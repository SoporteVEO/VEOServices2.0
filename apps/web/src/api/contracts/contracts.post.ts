import { apiFetch } from "@/lib/api";

export type ContractReportType = "monthly" | "installation" | "maintenance";

export interface ReportUploadUrl {
  key: string;
  url: string;
}

export async function createReportUploadUrl(): Promise<ReportUploadUrl> {
  return apiFetch<ReportUploadUrl>("/contracts/report-upload-url", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export interface SendMaintenanceReportInput {
  email: string;
  contractNumber: string;
  customerName: string;
  description?: string;
  period: string;
  fileName: string;
  fileKey: string;
  reportType?: ContractReportType;
}

export async function sendMaintenanceReport(input: SendMaintenanceReportInput) {
  return apiFetch<{ success: boolean }>("/contracts/send-maintenance-report", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
