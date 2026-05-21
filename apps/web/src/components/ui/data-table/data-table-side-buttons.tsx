"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DataTableSideButtonsProps = {
  children: ReactNode;
};

export function DataTableSideButtons({ children }: DataTableSideButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const checkOverflow = () => {
      setIsOverflowing(measure.scrollWidth > container.clientWidth + 1);
    };

    checkOverflow();

    const observer = new ResizeObserver(checkOverflow);
    observer.observe(container);
    observer.observe(measure);

    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={containerRef}
      className="relative ml-auto flex min-h-8 min-w-0 flex-1 items-center justify-end"
    >
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 flex w-max items-center gap-2 opacity-0"
      >
        {children}
      </div>

      {isOverflowing ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              sizeVariant="sm"
              className="px-2"
              aria-label="Más acciones"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-auto p-3">
            <div className="flex flex-col items-stretch gap-2">{children}</div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}
