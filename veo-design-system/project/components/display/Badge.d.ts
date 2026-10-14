import type { ReactNode, CSSProperties } from "react";

/** Status label with a square pixel marker. */
export interface BadgeProps {
  /** verified (Lime) · active · pending · offline · neutral · dark */
  tone?: "verified" | "active" | "pending" | "offline" | "neutral" | "dark";
  dot?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
