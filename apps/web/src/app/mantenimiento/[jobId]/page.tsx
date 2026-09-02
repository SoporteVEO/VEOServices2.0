import { MaintenanceJobDetail } from "@/components/pages/maintenance-portal";

export default async function MaintenancePortalJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <MaintenanceJobDetail jobId={jobId} />;
}
