export const PRODUCTION_ART_FOLDER = 'production-orders/art';

export const MAX_PRODUCTION_ART_BYTES = 100 * 1024 * 1024;

export const PRODUCTION_ART_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/tiff': 'tif',
  'application/pdf': 'pdf',
};

export const PRODUCTION_ART_MIME_TYPES = Object.keys(PRODUCTION_ART_EXTENSIONS);

export const PRODUCTION_ART_KEY_REGEX = new RegExp(
  `^${PRODUCTION_ART_FOLDER}/[A-Za-z0-9-]+\\.(${Object.values(PRODUCTION_ART_EXTENSIONS).join('|')})$`,
);
