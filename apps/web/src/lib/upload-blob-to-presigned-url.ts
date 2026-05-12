export interface UploadBlobToPresignedUrlInput {
  url: string;
  blob: Blob;
  contentType?: string;
}

export async function uploadBlobToPresignedUrl({
  url,
  blob,
  contentType,
}: UploadBlobToPresignedUrlInput): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    body: blob,
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });

  if (!response.ok) {
    throw new Error(
      `Falló la subida del archivo (HTTP ${response.status} ${response.statusText})`,
    );
  }
}
