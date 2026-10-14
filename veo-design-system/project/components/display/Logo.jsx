import React from "react";

const FILES = { dark: "veo-logo-dark.png", light: "veo-logo-light.png", mono: "veo-logo-mono-dark.png", "isotipo-lime": "veo-isotipo-lime.png", "isotipo-dark": "veo-isotipo-dark.png" };

export function Logo({ variant = "dark", height = 24, claim = false, assetsBase = "assets", style }) {
  const iso = variant.startsWith("isotipo");
  const img = <img src={`${assetsBase}/logo/${FILES[variant] || FILES.dark}`} alt="VEO" style={{ height, width: "auto", display: "block" }} />;
  if (!claim || iso) return <span style={{ display: "inline-flex", ...style }}>{img}</span>;
  const ink = variant === "light" ? "var(--veo-white)" : "var(--veo-dark)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: height * 0.75, ...style }}>
      {img}
      <span style={{ font: `var(--weight-regular) ${Math.round(height * 0.42)}px/1.05 var(--font-sans)`, color: ink }}>Presencia visual<br />inteligente</span>
    </span>
  );
}
