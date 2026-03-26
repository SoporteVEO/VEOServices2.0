"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MonitorPlay, ImageIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/ui/select";

interface TypeSelectProps {
  value: "estatica" | "digital";
}

export function TypeSelect({ value }: TypeSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams?.toString());
    if (next === "estatica") {
      params.delete("tipo");
      params.delete("spots");
    } else {
      params.set("tipo", "digital");
      if (!params.get("spots")) {
        params.set("spots", "300");
      }
    }
    router.push(`/shop?${params}`);
  }

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 w-full sm:w-auto min-w-0 sm:min-w-[200px]">
      <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
        Formato
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full !h-9 sm:!h-12 bg-background/50 hover:bg-accent/30 transition-colors border-border/50 shadow-sm rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium [&_[data-description]]:hidden [&_[data-icon-wrapper]]:size-4 sm:[&_[data-icon-wrapper]]:size-5 [&_[data-icon]]:size-3 [&_[data-icon-wrapper]]:rounded-sm cursor-pointer">
          <SelectValue placeholder="Selecciona formato" />
        </SelectTrigger>
        <SelectContent
          align="start"
          className="rounded-xl border-border/50 shadow-lg"
        >
          <SelectItem
            value="estatica"
            className="py-3 px-4 cursor-pointer focus:bg-accent/50 rounded-lg m-1 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                data-icon-wrapper
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400"
              >
                <ImageIcon data-icon className="size-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-foreground">
                  Vallas Estáticas
                </span>
                <span
                  data-description
                  className="text-[11px] text-muted-foreground font-normal mt-0.5"
                >
                  Exhibición tradicional 24/7
                </span>
              </div>
            </div>
          </SelectItem>
          <SelectItem
            value="digital"
            className="py-3 px-4 cursor-pointer focus:bg-accent/50 rounded-lg m-1 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                data-icon-wrapper
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400"
              >
                <MonitorPlay data-icon className="size-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-foreground">
                  Vallas Digitales
                </span>
                <span
                  data-description
                  className="text-[11px] text-muted-foreground font-normal mt-0.5"
                >
                  Pantallas LED dinámicas
                </span>
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
