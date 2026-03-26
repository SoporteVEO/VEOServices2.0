import type { ReactNode } from "react";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Premium subtle background pattern */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(120,119,198,0.05),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(74,73,143,0.05),transparent_50%)]"
        aria-hidden="true"
      />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {children}
      </div>
    </div>
  );
}
