import type { SubRole, UserRole } from "@/api/users/users.types";

export const INSTALLER_PORTAL_BASE = "/portal";

/**
 * What a given role is allowed to do inside the portal. The two field roles
 * split the job in half: the installer mounts the panel on site and needs to
 * find it, while the operario only vulcanises the material in the shop and
 * has no reason to see where it is going.
 */
export interface PortalCapabilities {
  canSeeLocation: boolean;
  /** Scheduling context: assigned installer, planned and actual dates. */
  canSeeInstallationDetails: boolean;
  canUploadInstallation: boolean;
  canUploadVulcanizado: boolean;
}

const INSTALLER_CAPABILITIES: PortalCapabilities = {
  canSeeLocation: true,
  canSeeInstallationDetails: true,
  canUploadInstallation: true,
  canUploadVulcanizado: false,
};

const WORKER_CAPABILITIES: PortalCapabilities = {
  canSeeLocation: false,
  canSeeInstallationDetails: false,
  canUploadInstallation: false,
  canUploadVulcanizado: true,
};

/** Admins and the production team supervise both halves of the job. */
const SUPERVISOR_CAPABILITIES: PortalCapabilities = {
  canSeeLocation: true,
  canSeeInstallationDetails: true,
  canUploadInstallation: true,
  canUploadVulcanizado: true,
};

const NO_CAPABILITIES: PortalCapabilities = {
  canSeeLocation: false,
  canSeeInstallationDetails: false,
  canUploadInstallation: false,
  canUploadVulcanizado: false,
};

export function portalCapabilitiesFor(
  role: UserRole | undefined,
  subRoles: SubRole[] = [],
): PortalCapabilities {
  if (role === "INSTALLER") return INSTALLER_CAPABILITIES;
  if (role === "WORKER") return WORKER_CAPABILITIES;
  if (role === "ADMIN") return SUPERVISOR_CAPABILITIES;
  if (role === "USER" && subRoles.includes("PRODUCTION")) {
    return SUPERVISOR_CAPABILITIES;
  }
  return NO_CAPABILITIES;
}

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
