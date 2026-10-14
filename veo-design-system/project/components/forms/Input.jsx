import React, { useState, useId } from "react";

export function Input({ label, hint, error, variant = "underline", tone = "light", leading, value, defaultValue, placeholder, type = "text", disabled = false, onChange, id: idProp, style, ...rest }) {
  const auto = useId();
  const id = idProp || auto;
  const [focus, setFocus] = useState(false);
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  const line = error ? "var(--veo-danger)" : focus ? (tone === "dark" ? "var(--veo-lime)" : "var(--veo-dark)") : (tone === "dark" ? "var(--veo-dark-60)" : "var(--veo-gray-40)");
  const boxed = variant === "boxed";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, opacity: disabled ? 0.5 : 1, ...style }}>
      {label ? <label htmlFor={id} style={{ font: "var(--weight-semibold) 12px/1 var(--font-sans)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: tone === "dark" ? "var(--veo-gray-40)" : "var(--veo-dark)" }}>{label}</label> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 12, height: boxed ? 48 : 42, padding: boxed ? "0 12px" : 0,
        background: boxed ? (tone === "dark" ? "var(--veo-dark-90)" : "var(--veo-white)") : "transparent",
        border: boxed ? `1px solid ${line}` : "none", borderBottom: `${focus && !boxed ? 2 : 1}px solid ${line}`, color: ink }}>
        {leading}
        <input id={id} type={type} value={value} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} onChange={onChange}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, minWidth: 0, height: "100%", border: 0, outline: 0, background: "transparent", color: ink, font: "var(--weight-regular) 14px/1 var(--font-sans)" }} {...rest} />
      </div>
      {error || hint ? <div style={{ font: "var(--weight-regular) 12px/1.4 var(--font-sans)", color: error ? "var(--veo-danger-ink)" : "var(--text-muted)" }}>{error || hint}</div> : null}
    </div>
  );
}
