export const MAX_ATTACHMENTS = 5;

export const ATTACHMENT_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_MIME_TYPES)
  .map((extension) => `.${extension}`)
  .join(",");

export function attachmentExtension(fileName: string): string | undefined {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && extension in ATTACHMENT_MIME_TYPES
    ? extension
    : undefined;
}
