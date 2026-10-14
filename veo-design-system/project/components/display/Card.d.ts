import type { ReactNode, CSSProperties, MouseEventHandler } from "react";

/**
 * Flat, square-cornered container on a brand field. No shadow; hover on interactive cards darkens the border.
 * @startingPoint section="Display" subtitle="Cards, badges, tags, stat tiles and the verification seal" viewport="700x560"
 */
export interface CardProps {
  /** plain (white) · sunken (Ice) · inverse (Dark) · structure (Gray) · signal (Lime — sparingly) */
  tone?: "plain" | "sunken" | "inverse" | "structure" | "signal";
  eyebrow?: ReactNode;
  title?: ReactNode;
  /** Image URL or node shown edge-to-edge on top */
  media?: string | ReactNode;
  mediaHeight?: number;
  padding?: number;
  footer?: ReactNode;
  interactive?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
