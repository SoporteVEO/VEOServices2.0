import React, { useState } from "react";

const SIZES = { sm: 36, md: 48, lg: 60 };
const VARIANTS = {
  primary: ["var(--veo-dark)", "var(--veo-white)", "var(--veo-gray)", "var(--veo-white)"],
  signal: ["var(--veo-lime)", "var(--veo-dark)", "var(--veo-dark)", "var(--veo-lime)"],
  secondary: ["transparent", "var(--veo-dark)", "var(--veo-dark)", "var(--veo-white)"],
  ghost: ["transparent", "currentColor", "var(--veo-ice)", "var(--veo-dark)"],
  inverse: ["transparent", "var(--veo-white)", "var(--veo-dark-80)", "var(--veo-lime)"],
};

export function IconButton({ icon, label, variant = "ghost", size = "md", disabled = false, onClick, style, ...rest }) {
  const [hover, setHover] = useState(false);
  const d = SIZES[size] || SIZES.md;
  const [bg, fg, hbg, hfg] = VARIANTS[variant] || VARIANTS.ghost;
  const on = hover && !disabled;
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: d, height: d, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, borderRadius: 0,
        border: variant === "secondary" ? "1px solid var(--veo-dark)" : "1px solid transparent",
        background: on ? hbg : bg, color: on ? hfg : fg, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        transition: "background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard)", ...style }} {...rest}>
      {icon}
    </button>
  );
}
