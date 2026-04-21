import { apiFetch } from "@/lib/api";

export interface SendMaintenanceReportInput {
  email: string;
  contractNumber: string;
  customerName: string;
  description?: string;
  period: string;
  fileName: string;
  fileBase64: string;
}

export async function sendMaintenanceReport(input: SendMaintenanceReportInput) {
  return apiFetch<{ success: boolean }>("/contracts/send-maintenance-report", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
