export const MAINTENANCE_PORTAL_BASE = "/mantenimiento";

export function maintenancePortalPath(jobId: string): string {
  return `${MAINTENANCE_PORTAL_BASE}/${jobId}`;
}
