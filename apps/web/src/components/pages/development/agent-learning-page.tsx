"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentFeedbackTable } from "./agent-feedback-table";
import { AgentLearningsTable } from "./agent-learnings-table";

export function AgentLearningPage() {
  return (
    <Tabs
      defaultValue="learnings"
      className="flex min-h-0 flex-1 flex-col gap-3"
    >
      <div className="flex flex-col gap-1">
        <TabsList className="self-start">
          <TabsTrigger value="learnings" className="px-4">
            Aprendizajes
          </TabsTrigger>
          <TabsTrigger value="feedback" className="px-4">
            Calificaciones
          </TabsTrigger>
        </TabsList>
        <p className="text-sm text-muted-foreground">
          Los aprendizajes activos se aplican a todos los usuarios. Los que
          están por revisar solo se aplican a quien los enseñó.
        </p>
      </div>
      <TabsContent
        value="learnings"
        className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <AgentLearningsTable />
      </TabsContent>
      <TabsContent
        value="feedback"
        className="flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <AgentFeedbackTable />
      </TabsContent>
    </Tabs>
  );
}
