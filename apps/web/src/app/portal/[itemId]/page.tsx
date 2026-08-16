import { InstallationTaskDetail } from "@/components/pages/installer-portal";

export default async function PortalTaskPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  return <InstallationTaskDetail itemId={itemId} />;
}
