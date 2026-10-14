import type { ReactNode, CSSProperties, MouseEventHandler } from "react";

/** Outlined filter chip; selected = Dark fill. Optional remove ×. */
export interface TagProps {
  selected?: boolean;
  icon?: ReactNode;
  tone?: "light" | "dark";
  onClick?: MouseEventHandler<HTMLSpanElement>;
  onRemove?: () => void;
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Tag(props: TagProps): JSX.Element;
