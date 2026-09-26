import {
  InstallationTaskDetail,
  InstallerPortalGuard,
} from "@/components/pages/installer-portal";

export default async function PortalTaskPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  return (
    <InstallerPortalGuard>
      <InstallationTaskDetail itemId={itemId} />
    </InstallerPortalGuard>
  );
}
