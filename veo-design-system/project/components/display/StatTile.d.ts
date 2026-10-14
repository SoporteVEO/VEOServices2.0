import type { ReactNode, CSSProperties } from "react";

/** Big verifiable number on a brand field — "359 Estructuras disponibles". Only real, auditable figures. */
export interface StatTileProps {
  value: ReactNode;
  label: ReactNode;
  delta?: ReactNode;
  tone?: "inverse" | "structure" | "sunken" | "plain" | "signal";
  /** sm 36 · md 48 · lg 72 */
  size?: "sm" | "md" | "lg";
  style?: CSSProperties;
}
export declare function StatTile(props: StatTileProps): JSX.Element;
