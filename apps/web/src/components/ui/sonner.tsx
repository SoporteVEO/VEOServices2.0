"use client";

import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "0px",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "font-sans border-l-4! shadow-float! gap-3! items-start! py-3.5!",
          title: "font-semibold text-sm",
          description: "text-[0.8125rem] text-muted-foreground!",
          success: "border-l-veo-lime! [&_[data-icon]]:text-success!",
          error: "border-l-destructive! [&_[data-icon]]:text-destructive!",
          warning: "border-l-amber-500! [&_[data-icon]]:text-warning!",
          info: "border-l-veo-gray! [&_[data-icon]]:text-info!",
          default: "border-l-veo-dark! dark:border-l-veo-ice!",
          actionButton: "rounded-none! bg-primary! text-primary-foreground!",
          cancelButton: "rounded-none!",
          closeButton: "rounded-none! border-border! bg-card! text-foreground!",
        },
      }}
      {...props}
    />
  );
}
