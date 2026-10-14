import type { CSSProperties, ReactNode } from "react";

/** Square checkbox; checked = Lime fill with Dark check. */
export interface CheckboxProps {
  label?: ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  tone?: "light" | "dark";
  onChange?: (checked: boolean) => void;
  style?: CSSProperties;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
