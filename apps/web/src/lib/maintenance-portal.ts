import { FIELD_PORTAL_BASE } from "@/lib/portal-access";

export function maintenancePortalPath(jobId: string): string {
  return `${FIELD_PORTAL_BASE}/mantenimiento/${jobId}`;
}
