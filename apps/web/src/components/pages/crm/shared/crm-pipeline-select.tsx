"use client";

import { useCrmPipelines } from "@/api/crm/crm.get";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CrmPipelineSelectProps {
  value: string | null;
  onChange: (pipelineId: string) => void;
  label?: string;
  className?: string;
}

/** Falls back to the default pipeline while `value` is still unset. */
export function CrmPipelineSelect({
  value,
  onChange,
  label,
  className,
}: CrmPipelineSelectProps) {
  const { data: pipelines = [] } = useCrmPipelines();
  const resolved =
    value ?? pipelines.find((p) => p.isDefault)?.id ?? pipelines[0]?.id ?? "";

  return (
    <Select
      label={label}
      value={resolved}
      onValueChange={onChange}
      disabled={pipelines.length === 0}
    >
      <SelectTrigger className={cn("w-56", className)}>
        <SelectValue placeholder="Pipeline" />
      </SelectTrigger>
      <SelectContent>
        {pipelines.map((pipeline) => (
          <SelectItem key={pipeline.id} value={pipeline.id}>
            {pipeline.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
