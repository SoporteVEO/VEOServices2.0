import type { CSSProperties, ReactNode } from "react";

/** Square radio — "nada es circular": the selected state is a pixel, not a dot. */
export interface RadioProps {
  label?: ReactNode;
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  tone?: "light" | "dark";
  onChange?: (value: string) => void;
  style?: CSSProperties;
}
export declare function Radio(props: RadioProps): JSX.Element;

export interface RadioGroupProps {
  options: Array<string | { value: string; label: ReactNode }>;
  value?: string;
  name?: string;
  direction?: "row" | "column";
  tone?: "light" | "dark";
  onChange?: (value: string) => void;
  style?: CSSProperties;
}
export declare function RadioGroup(props: RadioGroupProps): JSX.Element;
