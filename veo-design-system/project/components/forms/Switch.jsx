import React from "react";

export function Switch({ label, checked, defaultChecked, disabled = false, onChange, tone = "light", style }) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked ?? inner;
  const toggle = () => { if (disabled) return; if (checked === undefined) setInner(!on); onChange && onChange(!on); };
  return (
    <label onClick={toggle} style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, color: tone === "dark" ? "var(--veo-white)" : "var(--veo-dark)", font: "var(--weight-regular) 14px/1.4 var(--font-sans)", ...style }}>
      <span role="switch" aria-checked={on} tabIndex={0} style={{ position: "relative", width: 42, height: 24, flexShrink: 0,
        background: on ? "var(--veo-lime)" : (tone === "dark" ? "var(--veo-dark-80)" : "var(--veo-gray-20)"), border: `1px solid ${on ? "var(--veo-lime)" : "var(--veo-gray-40)"}` }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 16, height: 16, background: on ? "var(--veo-dark)" : "var(--veo-white)", transition: "left var(--motion-fast) var(--ease-step)" }} />
      </span>
      {label}
    </label>
  );
}
