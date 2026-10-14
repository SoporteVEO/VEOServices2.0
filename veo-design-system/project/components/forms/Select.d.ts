import type { CSSProperties, ChangeEventHandler } from "react";

export interface SelectOption { value: string; label: string; }
/** Native select styled like Input (underline or boxed) with a square-cap chevron. */
export interface SelectProps {
  label?: string;
  options: Array<string | SelectOption>;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  variant?: "underline" | "boxed";
  tone?: "light" | "dark";
  disabled?: boolean;
  id?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  style?: CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;
