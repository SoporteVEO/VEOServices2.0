import React from "react";
import { Glyph } from "../icons/Glyph.jsx";

export function Checkbox({ label, checked, defaultChecked, disabled = false, onChange, tone = "light", style }) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => { if (disabled) return; if (checked === undefined) setInner(!on); onChange && onChange(!on); };
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  return (
    <label onClick={toggle} style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, color: ink, font: "var(--weight-regular) 14px/1.4 var(--font-sans)", ...style }}>
      <span role="checkbox" aria-checked={on} tabIndex={0} onKeyDown={(e) => { if (e.key === " ") { e.preventDefault(); toggle(); } }}
        style={{ width: 18, height: 18, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: `1.5px solid ${on ? "var(--veo-dark)" : (tone === "dark" ? "var(--veo-gray-70)" : "var(--veo-dark)")}`,
          background: on ? "var(--veo-lime)" : "transparent", color: "var(--veo-dark)", transition: "background var(--motion-instant) linear" }}>
        {on ? <Glyph name="check" size={14} strokeWidth={3} /> : null}
      </span>
      {label}
    </label>
  );
}
