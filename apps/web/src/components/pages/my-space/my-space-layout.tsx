"use client";

import type { ReactNode } from "react";
import { MySpaceSidebar } from "./my-space-sidebar";

export function MySpaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 -m-3 gap-4">
      <MySpaceSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto pt-4 pr-4 pb-4 pl-1">
        {children}
      </div>
    </div>
  );
}
