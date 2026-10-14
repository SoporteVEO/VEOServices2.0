import type { CSSProperties } from "react";

/** VEO logotipo / isotipo from the official PNGs. Never recolor the wordmark in Lime, never rotate except vertical-ascending. */
export interface LogoProps {
  /** dark (on light) · light (on Dark/Gray) · mono (all Dark, for Lime fields) · isotipo-lime · isotipo-dark */
  variant?: "dark" | "light" | "mono" | "isotipo-lime" | "isotipo-dark";
  height?: number;
  /** Adds the two-line block claim "Presencia visual inteligente" (horizontal version) */
  claim?: boolean;
  assetsBase?: string;
  style?: CSSProperties;
}
export declare function Logo(props: LogoProps): JSX.Element;
