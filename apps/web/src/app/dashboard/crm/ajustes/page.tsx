import { CrmSettingsPage } from "@/components/pages/crm/settings/crm-settings-page";

export default async function CrmSettingsRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ gmail?: string; reason?: string }>;
}) {
  const { gmail, reason } = await searchParams;
  const gmailResult = gmail === "connected" || gmail === "error" ? gmail : undefined;

  return <CrmSettingsPage gmailResult={gmailResult} gmailReason={reason} />;
}
