import React from "react";

const TONES = {
  plain: { bg: "var(--veo-white)", fg: "var(--veo-dark)", bd: "1px solid var(--border-subtle)", sub: "var(--veo-gray)" },
  sunken: { bg: "var(--veo-ice)", fg: "var(--veo-dark)", bd: "1px solid transparent", sub: "var(--veo-gray)" },
  inverse: { bg: "var(--veo-dark)", fg: "var(--veo-white)", bd: "1px solid var(--veo-dark)", sub: "var(--veo-gray-40)" },
  structure: { bg: "var(--veo-gray)", fg: "var(--veo-white)", bd: "1px solid var(--veo-gray)", sub: "var(--veo-ice)" },
  signal: { bg: "var(--veo-lime)", fg: "var(--veo-dark)", bd: "1px solid var(--veo-lime)", sub: "var(--veo-dark)" },
};

export function Card({ tone = "plain", eyebrow, title, media, mediaHeight = 180, padding = 24, footer, interactive = false, onClick, children, style }) {
  const [hover, setHover] = React.useState(false);
  const t = TONES[tone] || TONES.plain;
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", flexDirection: "column", background: t.bg, color: t.fg, border: interactive && hover ? "1px solid var(--veo-dark)" : t.bd, borderRadius: 0,
        cursor: interactive ? "pointer" : undefined, transition: "border-color var(--motion-fast) var(--ease-standard)", overflow: "hidden", ...style }}>
      {media ? <div style={{ height: mediaHeight, background: "var(--veo-dark)", overflow: "hidden" }}>{typeof media === "string" ? <img src={media} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : media}</div> : null}
      <div style={{ padding, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {eyebrow ? <div style={{ font: "var(--weight-semibold) 12px/1 var(--font-sans)", letterSpacing: "var(--tracking-eyebrow)", textTransform: "uppercase", color: t.sub }}>{eyebrow}</div> : null}
        {title ? <div style={{ font: "var(--weight-semibold) 24px/1.1 var(--font-display)" }}>{title}</div> : null}
        {children ? <div style={{ font: "var(--weight-light) 14px/1.4 var(--font-sans)" }}>{children}</div> : null}
      </div>
      {footer ? <div style={{ padding: `12px ${padding}px`, borderTop: `1px solid ${tone === "inverse" ? "var(--veo-dark-80)" : "rgba(27,38,41,.12)"}`, display: "flex", alignItems: "center", gap: 12 }}>{footer}</div> : null}
    </div>
  );
}
