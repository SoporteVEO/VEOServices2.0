import type { ReactNode, CSSProperties, MouseEventHandler } from "react";

/** Square icon-only button. Always pass an accessible label. */
export interface IconButtonProps {
  icon: ReactNode;
  /** Accessible label, also shown as native title */
  label: string;
  variant?: "primary" | "signal" | "secondary" | "ghost" | "inverse";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
