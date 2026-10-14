import React from "react";

const TONES = {
  inverse: ["var(--veo-dark)", "var(--veo-lime)", "var(--veo-white)"],
  structure: ["var(--veo-gray)", "var(--veo-white)", "var(--veo-white)"],
  sunken: ["var(--veo-ice)", "var(--veo-dark)", "var(--veo-gray)"],
  plain: ["var(--veo-white)", "var(--veo-dark)", "var(--veo-gray)"],
  signal: ["var(--veo-lime)", "var(--veo-dark)", "var(--veo-dark)"],
};

export function StatTile({ value, label, delta, tone = "inverse", size = "md", style }) {
  const [bg, num, lab] = TONES[tone] || TONES.inverse;
  const fs = size === "lg" ? 72 : size === "sm" ? 36 : 48;
  return (
    <div style={{ background: bg, padding: 24, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 6, minHeight: size === "lg" ? 216 : 132,
      border: tone === "plain" ? "1px solid var(--border-subtle)" : "none", ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ font: `var(--weight-semibold) ${fs}px/1 var(--font-display)`, letterSpacing: "var(--tracking-display)", color: num }}>{value}</span>
        {delta ? <span style={{ font: "var(--weight-regular) 12px/1 var(--font-sans)", color: lab }}>{delta}</span> : null}
      </div>
      <div style={{ font: "var(--weight-regular) 14px/1.25 var(--font-sans)", color: lab, maxWidth: 180 }}>{label}</div>
    </div>
  );
}
