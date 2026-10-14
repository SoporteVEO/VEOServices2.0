import type { ReactNode, CSSProperties, MouseEventHandler } from "react";

/**
 * Square-cornered action button. Hover swaps fills (a module "turning on"); no shrink, no bounce.
 * @startingPoint section="Forms" subtitle="Primary, signal, secondary, inverse, ghost buttons" viewport="700x320"
 */
export interface ButtonProps {
  /** primary = Dark fill; signal = Lime CTA (one per view); secondary = outline; inverse = on dark; ghost = text; danger = destructive */
  variant?: "primary" | "signal" | "secondary" | "inverse" | "ghost" | "danger";
  /** sm 36px · md 48px · lg 60px */
  size?: "sm" | "md" | "lg";
  /** Usually <Glyph name="arrow-up-right" size={16} /> */
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
