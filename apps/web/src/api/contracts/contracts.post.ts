import { apiFetch } from "@/lib/api";

export type ContractReportType = "monthly" | "installation" | "maintenance";

export interface SendMaintenanceReportInput {
  email: string;
  contractNumber: string;
  customerName: string;
  description?: string;
  period: string;
  fileName: string;
  fileBase64: string;
  reportType?: ContractReportType;
}

export async function sendMaintenanceReport(input: SendMaintenanceReportInput) {
  return apiFetch<{ success: boolean }>("/contracts/send-maintenance-report", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
