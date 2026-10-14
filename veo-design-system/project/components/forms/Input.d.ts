import type { ReactNode, CSSProperties, ChangeEventHandler } from "react";

/**
 * Text field. Default is the underline field from the VEO web forms; "boxed" for dense app filters.
 * @startingPoint section="Forms" subtitle="Underline and boxed text fields, select, checks" viewport="700x420"
 */
export interface InputProps {
  /** Uppercase eyebrow label above the field */
  label?: string;
  hint?: string;
  /** Error message — turns the rule red */
  error?: string;
  variant?: "underline" | "boxed";
  /** Use "dark" on VEO Dark surfaces */
  tone?: "light" | "dark";
  /** Leading glyph, e.g. <Glyph name="search" size={16} /> */
  leading?: ReactNode;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  id?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  style?: CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
