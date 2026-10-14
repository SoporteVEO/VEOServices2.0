import type { ReactNode } from "react";

/**
 * Modal panel on a Dark scrim. Appears/disappears — never slides in.
 * @startingPoint section="Feedback" subtitle="Dialog, toast and tooltip" viewport="700x420"
 */
export interface DialogProps {
  open: boolean;
  title: ReactNode;
  eyebrow?: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
  width?: number;
  children?: ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
