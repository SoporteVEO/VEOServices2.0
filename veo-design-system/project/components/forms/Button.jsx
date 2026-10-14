import React, { useState } from "react";

const SIZES = { sm: { h: 36, px: 12, fs: 12, gap: 6 }, md: { h: 48, px: 18, fs: 14, gap: 12 }, lg: { h: 60, px: 24, fs: 18, gap: 12 } };
const VARIANTS = {
  primary:   { bg: "var(--veo-dark)", fg: "var(--veo-white)", bd: "var(--veo-dark)", hbg: "var(--veo-gray)", hfg: "var(--veo-white)", hbd: "var(--veo-gray)" },
  signal:    { bg: "var(--veo-lime)", fg: "var(--veo-dark)", bd: "var(--veo-lime)", hbg: "var(--veo-dark)", hfg: "var(--veo-lime)", hbd: "var(--veo-dark)" },
  secondary: { bg: "transparent", fg: "var(--veo-dark)", bd: "var(--veo-dark)", hbg: "var(--veo-dark)", hfg: "var(--veo-white)", hbd: "var(--veo-dark)" },
  inverse:   { bg: "var(--veo-white)", fg: "var(--veo-dark)", bd: "var(--veo-white)", hbg: "var(--veo-lime)", hfg: "var(--veo-dark)", hbd: "var(--veo-lime)" },
  ghost:     { bg: "transparent", fg: "var(--veo-dark)", bd: "transparent", hbg: "var(--veo-ice)", hfg: "var(--veo-dark)", hbd: "transparent" },
  danger:    { bg: "var(--veo-danger)", fg: "var(--veo-white)", bd: "var(--veo-danger)", hbg: "var(--veo-danger-ink)", hfg: "var(--veo-white)", hbd: "var(--veo-danger-ink)" },
};

export function Button({ variant = "primary", size = "md", icon, iconPosition = "end", fullWidth = false, disabled = false, type = "button", children, style, onClick, ...rest }) {
  const [hover, setHover] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const on = hover && !disabled;
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: fullWidth ? "flex" : "inline-flex", width: fullWidth ? "100%" : undefined,
        alignItems: "center", justifyContent: icon && fullWidth ? "space-between" : "center", gap: s.gap,
        height: s.h, padding: `0 ${s.px}px`, border: `1px solid ${on ? v.hbd : v.bd}`, borderRadius: 0,
        background: on ? v.hbg : v.bg, color: on ? v.hfg : v.fg,
        font: `var(--weight-regular) ${s.fs}px/1 var(--font-sans)`, whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        transition: "background var(--motion-fast) var(--ease-standard), color var(--motion-fast) var(--ease-standard), border-color var(--motion-fast) var(--ease-standard)",
        ...style,
      }} {...rest}>
      {icon && iconPosition === "start" ? icon : null}
      {children != null ? <span>{children}</span> : null}
      {icon && iconPosition === "end" ? icon : null}
    </button>
  );
}
