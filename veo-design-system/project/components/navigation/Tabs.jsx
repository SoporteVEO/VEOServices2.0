import React from "react";

export function Tabs({ items = [], value, onChange, tone = "light", style }) {
  const dark = tone === "dark";
  return (
    <div role="tablist" style={{ display: "flex", gap: 24, borderBottom: `1px solid ${dark ? "var(--veo-dark-80)" : "var(--border-subtle)"}`, ...style }}>
      {items.map((it) => {
        const t = typeof it === "string" ? { value: it, label: it } : it;
        const on = t.value === value;
        return (
          <button key={t.value} role="tab" aria-selected={on} onClick={() => onChange && onChange(t.value)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 48, padding: 0, marginBottom: -1, background: "none", border: 0, cursor: "pointer",
              borderBottom: `2px solid ${on ? (dark ? "var(--veo-lime)" : "var(--veo-dark)") : "transparent"}`,
              color: on ? (dark ? "var(--veo-white)" : "var(--veo-dark)") : (dark ? "var(--veo-gray-40)" : "var(--veo-gray)"),
              font: `${on ? "var(--weight-semibold)" : "var(--weight-regular)"} 14px/1 var(--font-sans)` }}>
            {t.label}
            {t.count != null ? <span style={{ font: "var(--weight-regular) 12px/1 var(--font-sans)", padding: "3px 6px", background: on ? (dark ? "var(--veo-lime)" : "var(--veo-dark)") : (dark ? "var(--veo-dark-80)" : "var(--veo-ice)"), color: on ? (dark ? "var(--veo-dark)" : "var(--veo-white)") : "inherit" }}>{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
