import type { ReactNode } from "react";

/** Small Dark label on hover/focus. No arrow, no animation. */
export interface TooltipProps {
  content: ReactNode;
  placement?: "top" | "bottom";
  children: ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
