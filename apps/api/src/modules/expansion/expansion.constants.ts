export const EXPANSION_SUB_ROLE = 'EXPANSION';

export const EXPANSION_SITE_CODE_PREFIX = 'EXP';

export const EXPANSION_DOCUMENT_FOLDER = 'expansion/documents';

export const MAX_EXPANSION_DOCUMENT_BYTES = 25 * 1024 * 1024;

/** Accepted document MIME types and the extension their S3 key gets. */
export const EXPANSION_DOCUMENT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'text/csv': 'csv',
  'text/plain': 'txt',
  'application/vnd.google-earth.kml+xml': 'kml',
  'application/vnd.google-earth.kmz': 'kmz',
};

export const EXPANSION_DOCUMENT_KEY_REGEX = new RegExp(
  `^${EXPANSION_DOCUMENT_FOLDER}/[A-Za-z0-9-]+\\.[a-z0-9]+$`,
);

export function formatSiteCode(number: number): string {
  return `${EXPANSION_SITE_CODE_PREFIX}-${String(number).padStart(4, '0')}`;
}
