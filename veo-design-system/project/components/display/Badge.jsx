import React from "react";

const TONES = {
  verified: ["var(--veo-lime)", "var(--veo-dark)", "var(--veo-dark)"],
  active: ["var(--veo-lime-soft)", "var(--veo-success-ink)", "var(--veo-lime-deep)"],
  pending: ["#FBEBC2", "var(--veo-warning-ink)", "var(--veo-warning)"],
  offline: ["#F8D9D6", "var(--veo-danger-ink)", "var(--veo-danger)"],
  neutral: ["var(--veo-ice)", "var(--veo-gray)", "var(--veo-gray)"],
  dark: ["var(--veo-dark)", "var(--veo-white)", "var(--veo-lime)"],
};

export function Badge({ tone = "neutral", dot = true, children, style }) {
  const [bg, fg, sq] = TONES[tone] || TONES.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 24, padding: "0 8px", background: bg, color: fg, borderRadius: 0,
      font: "var(--weight-semibold) 12px/1 var(--font-sans)", letterSpacing: "0.02em", whiteSpace: "nowrap", ...style }}>
      {dot ? <span style={{ width: 6, height: 6, background: sq, flexShrink: 0 }} /> : null}
      {children}
    </span>
  );
}
