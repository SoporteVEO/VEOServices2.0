import {
  MaintenanceJobDetail,
  MaintenancePortalGuard,
} from "@/components/pages/maintenance-portal";

export default async function PortalMaintenanceJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return (
    <MaintenancePortalGuard>
      <MaintenanceJobDetail jobId={jobId} />
    </MaintenancePortalGuard>
  );
}
