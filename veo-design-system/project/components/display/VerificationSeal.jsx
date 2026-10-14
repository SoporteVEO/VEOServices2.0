import React from "react";

export function VerificationSeal({ value, label, meta, tone = "inverse", assetsBase = "assets", style }) {
  const dark = tone === "inverse";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 18, padding: "18px 24px", background: dark ? "var(--veo-dark)" : "var(--veo-white)",
      border: dark ? "none" : "1px solid var(--veo-dark)", color: dark ? "var(--veo-white)" : "var(--veo-dark)", ...style }}>
      <img src={`${assetsBase}/logo/${dark ? "veo-isotipo-lime.png" : "veo-isotipo-dark.png"}`} alt="VEO" style={{ height: 30, width: "auto", display: "block" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, borderLeft: `1px solid ${dark ? "var(--veo-dark-60)" : "var(--veo-gray-40)"}`, paddingLeft: 18 }}>
        <span style={{ font: "var(--weight-semibold) 36px/1 var(--font-display)", letterSpacing: "var(--tracking-display)", color: dark ? "var(--veo-lime)" : "var(--veo-dark)" }}>{value}</span>
        <span style={{ font: "var(--weight-regular) 12px/1.3 var(--font-sans)" }}>{label}</span>
        {meta ? <span style={{ font: "var(--weight-regular) 12px/1.3 var(--font-sans)", color: dark ? "var(--veo-gray-40)" : "var(--veo-gray)" }}>{meta}</span> : null}
      </div>
    </div>
  );
}
