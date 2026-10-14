import React from "react";

export function Tooltip({ content, placement = "top", children }) {
  const [open, setOpen] = React.useState(false);
  const pos = placement === "bottom" ? { top: "calc(100% + 6px)" } : { bottom: "calc(100% + 6px)" };
  return (
    <span onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} style={{ position: "relative", display: "inline-flex" }}>
      {children}
      {open ? <span role="tooltip" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", ...pos, zIndex: 50, whiteSpace: "nowrap", padding: "6px 8px",
        background: "var(--veo-dark)", color: "var(--veo-white)", font: "var(--weight-regular) 12px/1.2 var(--font-sans)", pointerEvents: "none" }}>{content}</span> : null}
    </span>
  );
}
