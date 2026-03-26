"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/ui/select";
import { DIGITAL_SPOT_OPTIONS, type DigitalSpotOption } from "@/lib/digital-spots";

interface SpotsSelectProps {
  value: DigitalSpotOption;
}

export function SpotsSelect({ value }: SpotsSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("spots", next);
    router.push(`/shop?${params}`);
  }

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 w-full sm:w-auto min-w-0 sm:min-w-[160px]">
      <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
        Spots / Hora
      </label>
      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger className="w-full !h-9 sm:!h-12 bg-background/50 hover:bg-accent/30 transition-colors border-border/50 shadow-sm rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Zap className="size-3.5 sm:size-4 text-purple-500" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent align="start" className="rounded-xl border-border/50 shadow-lg">
          {DIGITAL_SPOT_OPTIONS.map((n) => (
            <SelectItem 
              key={n} 
              value={String(n)}
              className="py-2.5 px-3 cursor-pointer focus:bg-accent/50 rounded-lg m-1 transition-colors"
            >
              <span className="font-medium">{n} spots</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
