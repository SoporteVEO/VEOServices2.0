import React from "react";

export const OOH_ICONS = ["01-mupi","02-mural","03-kiosk","04-wall-scaffold","05-hanging-sign","06-round-sign","07-pole-banner","08-wall-disc","09-rooftop","10-fence-board","11-bridge-board","12-unipole","13-twin-leg","14-square-board","15-small-board","16-lit-board","17-screen-stand","18-wall-panel","19-totem","20-mini-totem","21-square-sign","22-retail-screen","23-monitor","24-overpass","25-highway","26-shelter","27-storefront","28-premium","29-mobile-truck","30-t-board","31-a-frame","32-bench"];

export function OOHIcon({ name, variant = "color", size = 32, assetsBase = "assets", style, ...rest }) {
  const file = OOH_ICONS.find((n) => n === name || n.slice(3) === name) || name;
  return <img src={`${assetsBase}/icons/${variant}/${file}.png`} alt={file.slice(3).replace(/-/g, " ")} width={size} height={size} style={{ display: "block", width: size, height: size, objectFit: "contain", ...style }} {...rest} />;
}
