import type { CSSProperties, ReactNode } from "react";

/** Rectangular toggle with a square knob; on = Lime track. */
export interface SwitchProps {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  tone?: "light" | "dark";
  onChange?: (checked: boolean) => void;
  style?: CSSProperties;
}
export declare function Switch(props: SwitchProps): JSX.Element;
