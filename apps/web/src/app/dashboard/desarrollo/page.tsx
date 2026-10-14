import { AgentIssuesTable } from "@/components/pages/development";

export default function DesarrolloPage() {
  return (
    <section className="flex h-[calc(100vh-6rem)] min-h-0 flex-col gap-3">
      <AgentIssuesTable />
    </section>
  );
}
