import React from "react";
import { Glyph } from "../icons/Glyph.jsx";

export function Tag({ selected = false, onRemove, onClick, icon, tone = "light", children, style }) {
  const [hover, setHover] = React.useState(false);
  const dark = tone === "dark";
  const bd = selected ? "var(--veo-dark)" : hover ? (dark ? "var(--veo-gray-40)" : "var(--veo-dark)") : (dark ? "var(--veo-dark-60)" : "var(--veo-gray-40)");
  return (
    <span onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: onRemove ? "0 6px 0 12px" : "0 12px",
        border: `1px solid ${bd}`, background: selected ? "var(--veo-dark)" : "transparent", color: selected || dark ? "var(--veo-white)" : "var(--veo-dark)",
        font: "var(--weight-regular) 12px/1 var(--font-sans)", cursor: onClick ? "pointer" : "default", whiteSpace: "nowrap", ...style }}>
      {icon}
      {children}
      {onRemove ? <span role="button" aria-label="Quitar" onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ display: "inline-flex", cursor: "pointer", opacity: 0.7 }}><Glyph name="x" size={14} /></span> : null}
    </span>
  );
}
