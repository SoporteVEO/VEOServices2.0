import type { ReactNode, CSSProperties } from "react";

export interface TabItem { value: string; label: ReactNode; count?: number; }
/**
 * Underline tabs. Active = 2px Dark rule (Lime on dark surfaces).
 * @startingPoint section="Navigation" subtitle="Underline tabs, light and dark" viewport="700x200"
 */
export interface TabsProps {
  items: Array<string | TabItem>;
  value: string;
  onChange?: (value: string) => void;
  tone?: "light" | "dark";
  style?: CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
