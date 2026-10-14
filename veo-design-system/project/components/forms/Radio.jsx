import React from "react";

export function Radio({ label, checked = false, disabled = false, onChange, name, value, tone = "light", style }) {
  const ink = tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)";
  return (
    <label onClick={() => !disabled && onChange && onChange(value)} style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, color: ink, font: "var(--weight-regular) 14px/1.4 var(--font-sans)", ...style }}>
      <span role="radio" aria-checked={checked} data-name={name} tabIndex={0}
        style={{ width: 18, height: 18, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${tone === "dark" ? "var(--veo-gray-70)" : "var(--veo-dark)"}` }}>
        {checked ? <span style={{ width: 8, height: 8, background: tone === "dark" ? "var(--veo-lime)" : "var(--veo-dark)" }} /> : null}
      </span>
      {label}
    </label>
  );
}

export function RadioGroup({ options = [], value, onChange, name, direction = "column", tone = "light", style }) {
  return (
    <div role="radiogroup" style={{ display: "flex", flexDirection: direction, gap: direction === "row" ? 24 : 12, ...style }}>
      {options.map((o) => { const opt = typeof o === "string" ? { value: o, label: o } : o; return <Radio key={opt.value} name={name} value={opt.value} label={opt.label} tone={tone} checked={value === opt.value} onChange={onChange} />; })}
    </div>
  );
}
