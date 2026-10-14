import React from "react";
import { Glyph } from "../icons/Glyph.jsx";

const MARK = { success: "var(--veo-lime)", info: "var(--veo-gray-70)", warning: "var(--veo-warning)", danger: "var(--veo-danger)" };

export function Toast({ tone = "success", title, children, action, onClose, style }) {
  return (
    <div role="status" style={{ display: "flex", alignItems: "flex-start", gap: 12, width: 380, maxWidth: "100%", padding: 18, background: "var(--veo-dark)", color: "var(--veo-white)", boxShadow: "var(--shadow-float)", ...style }}>
      <span style={{ width: 12, height: 12, marginTop: 4, flexShrink: 0, background: MARK[tone] || MARK.info }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {title ? <div style={{ font: "var(--weight-semibold) 14px/1.3 var(--font-sans)" }}>{title}</div> : null}
        {children ? <div style={{ font: "var(--weight-regular) 12px/1.4 var(--font-sans)", color: "var(--veo-gray-40)" }}>{children}</div> : null}
        {action ? <div style={{ marginTop: 6 }}>{action}</div> : null}
      </div>
      {onClose ? <button aria-label="Cerrar" onClick={onClose} style={{ border: 0, background: "none", color: "var(--veo-gray-40)", cursor: "pointer", padding: 0 }}><Glyph name="x" size={16} /></button> : null}
    </div>
  );
}
