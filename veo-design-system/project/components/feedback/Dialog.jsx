import React from "react";
import { Glyph } from "../icons/Glyph.jsx";

export function Dialog({ open, title, eyebrow, onClose, footer, width = 520, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--overlay-scrim)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: "100%", background: "var(--veo-white)", color: "var(--veo-dark)", boxShadow: "var(--shadow-overlay)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, padding: "24px 24px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {eyebrow ? <span style={{ font: "var(--weight-semibold) 12px/1 var(--font-sans)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: "var(--veo-gray)" }}>{eyebrow}</span> : null}
            <span style={{ font: "var(--weight-semibold) 24px/1.1 var(--font-display)" }}>{title}</span>
          </div>
          <button aria-label="Cerrar" onClick={onClose} style={{ width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", border: 0, background: "transparent", cursor: "pointer", color: "var(--veo-dark)", marginTop: -6, marginRight: -6 }}><Glyph name="x" /></button>
        </div>
        <div style={{ padding: 24, font: "var(--weight-light) 14px/1.5 var(--font-sans)" }}>{children}</div>
        {footer ? <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "18px 24px", borderTop: "1px solid var(--border-subtle)" }}>{footer}</div> : null}
      </div>
    </div>
  );
}
