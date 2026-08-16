export const INSTALLER_PORTAL_BASE = "/portal";

export function installerPortalPath(itemId: string): string {
  return `${INSTALLER_PORTAL_BASE}/${itemId}`;
}

/**
 * Absolute URL encoded into the QR code. Falls back to `NEXT_PUBLIC_APP_URL`
 * when rendered on the server, where `window` is unavailable.
 */
export function installerPortalUrl(itemId: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  return `${origin}${installerPortalPath(itemId)}`;
}

/** Opens the coordinates in the native Google Maps app when on mobile. */
export function googleMapsUrl(
  latitude: number | null,
  longitude: number | null,
  fallbackAddress?: string | null,
): string | null {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  if (fallbackAddress?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      fallbackAddress.trim(),
    )}`;
  }
  return null;
}

/**
 * OpenStreetMap embed centred on the billboard. Chosen over the Google Maps
 * Embed API because it needs no API key.
 */
export function openStreetMapEmbedUrl(
  latitude: number,
  longitude: number,
  delta = 0.004,
): string {
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
}
