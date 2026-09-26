import type { MetadataRoute } from "next";

import { BRAND_COLORS } from "@/lib/brand-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/portal",
    name: "Veo Services",
    short_name: "Veo",
    description: "Órdenes de instalación y mantenimiento de vallas",
    start_url: "/portal",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND_COLORS.snow,
    theme_color: BRAND_COLORS.dark,
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
