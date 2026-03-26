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
