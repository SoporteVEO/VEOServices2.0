import type { CSSProperties } from "react";

/** VEO's own OOH structure icon set (32 icons, manual §6.1), line or two-tone color. */
export interface OOHIconProps {
  /** e.g. "12-unipole" or just "unipole" */
  name: string;
  /** line = VEO Gray single-tone (works on Dark) · color = two-tone for light surfaces */
  variant?: "line" | "color";
  size?: number;
  /** Path to the copied assets/ folder relative to the page */
  assetsBase?: string;
  style?: CSSProperties;
}
export declare function OOHIcon(props: OOHIconProps): JSX.Element;
export declare const OOH_ICONS: string[];
