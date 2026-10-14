import type { ReactNode, CSSProperties } from "react";

/** Dark notification with a square status marker. Copy in present tense, stating facts. */
export interface ToastProps {
  tone?: "success" | "info" | "warning" | "danger";
  title?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Toast(props: ToastProps): JSX.Element;
