import React, { useState, useId } from "react";
import { Glyph } from "../icons/Glyph.jsx";

export function Select({ label, options = [], value, defaultValue, placeholder, variant = "underline", tone = "light", disabled = false, onChange, id: idProp, style, ...rest }) {
  const auto = useId();
  const id = idProp || auto;
  const [focus, setFocus] = useState(false);
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  const line = focus ? (tone === "dark" ? "var(--veo-lime)" : "var(--veo-dark)") : (tone === "dark" ? "var(--veo-dark-60)" : "var(--veo-gray-40)");
  const boxed = variant === "boxed";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, opacity: disabled ? 0.5 : 1, ...style }}>
      {label ? <label htmlFor={id} style={{ font: "var(--weight-semibold) 12px/1 var(--font-sans)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: tone === "dark" ? "var(--veo-gray-40)" : "var(--veo-dark)" }}>{label}</label> : null}
      <div style={{ position: "relative", display: "flex", alignItems: "center", height: boxed ? 48 : 42, color: ink,
        background: boxed ? (tone === "dark" ? "var(--veo-dark-90)" : "var(--veo-white)") : "transparent",
        border: boxed ? `1px solid ${line}` : "none", borderBottom: `${focus && !boxed ? 2 : 1}px solid ${line}` }}>
        <select id={id} value={value} defaultValue={defaultValue ?? (placeholder ? "" : undefined)} disabled={disabled} onChange={onChange}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ appearance: "none", WebkitAppearance: "none", width: "100%", height: "100%", border: 0, outline: 0, background: "transparent", color: ink,
            padding: boxed ? "0 36px 0 12px" : "0 30px 0 0", font: "var(--weight-regular) 14px/1 var(--font-sans)", cursor: "pointer" }} {...rest}>
          {placeholder ? <option value="" disabled>{placeholder}</option> : null}
          {options.map((o) => { const opt = typeof o === "string" ? { value: o, label: o } : o; return <option key={opt.value} value={opt.value}>{opt.label}</option>; })}
        </select>
        <Glyph name="chevron-down" size={16} style={{ position: "absolute", right: boxed ? 12 : 0, pointerEvents: "none" }} />
      </div>
    </div>
  );
}
