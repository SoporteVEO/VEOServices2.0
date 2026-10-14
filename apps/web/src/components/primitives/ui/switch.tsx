"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center border p-0.5 transition-colors duration-150 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:border-destructive data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 data-checked:border-veo-dark data-checked:bg-veo-dark data-unchecked:border-border-strong data-unchecked:bg-muted dark:data-checked:border-veo-lime dark:data-checked:bg-veo-lime data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block transition-transform duration-150 ease-standard group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 group-data-[size=default]/switch:data-checked:translate-x-4 rtl:group-data-[size=default]/switch:data-checked:-translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3 rtl:group-data-[size=sm]/switch:data-checked:-translate-x-3 data-checked:bg-veo-lime data-unchecked:translate-x-0 data-unchecked:bg-border-strong dark:data-checked:bg-veo-dark"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
