import type { ReactNode, CSSProperties } from "react";

/** Sello de verificación (manual §4.2): isotipo + campaign figure, signs Sitecam reports. The only place the mark sits next to a number — and only if the number is real. */
export interface VerificationSealProps {
  value: ReactNode;
  label: ReactNode;
  /** e.g. "Sitecam · 01–21 oct 2026 · Permiso SS-0142" */
  meta?: ReactNode;
  tone?: "inverse" | "light";
  assetsBase?: string;
  style?: CSSProperties;
}
export declare function VerificationSeal(props: VerificationSealProps): JSX.Element;
