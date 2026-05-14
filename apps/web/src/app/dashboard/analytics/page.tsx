"use client";

import { AnalyticsPageTabs } from "@/components/pages/analytics";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 min-w-0">
      <AnalyticsPageTabs />
    </div>
  );
}
