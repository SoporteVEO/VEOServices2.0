"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import type { MentorshipSession } from "@/api/mentorships/mentorships.types";
import { Button } from "@/components/ui/button";
import { downloadMentorshipPdf } from "./download-mentorship-pdf";

export function PdfDownloadButton({
  sessions,
  label = "PDF",
}: {
  sessions: MentorshipSession[];
  label?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  function handleClick() {
    setIsGenerating(true);
    downloadMentorshipPdf(sessions)
      .catch(() => toast.error("No se pudo generar el PDF"))
      .finally(() => setIsGenerating(false));
  }

  return (
    <Button
      variant="outline"
      sizeVariant="sm"
      icon={FileDown}
      loading={isGenerating}
      disabled={sessions.length === 0}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
