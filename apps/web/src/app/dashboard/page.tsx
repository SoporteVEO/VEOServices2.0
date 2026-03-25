import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/primitives/ui/card";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
      <div className="space-y-1">
        <h1 className="font-(family-name:--font-heading) text-3xl font-semibold tracking-tight md:text-4xl">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Your workspace lives under{" "}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
            /dashboard
          </code>
          . Add routes and sidebar items as you grow.
        </p>
      </div>
      <Card className="max-w-xl border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="font-(family-name:--font-heading) text-xl">
            Getting started
          </CardTitle>
          <CardDescription>
            Use the sidebar to navigate. Toggle the color theme from the header
            anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Collapse the sidebar with the trigger or{" "}
          <kbd className="pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded border bg-muted px-1 font-mono text-[10px] font-medium">
            Ctrl+B
          </kbd>
          .
        </CardContent>
      </Card>
    </div>
  );
}
