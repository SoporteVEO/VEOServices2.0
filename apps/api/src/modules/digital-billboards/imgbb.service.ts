import { Injectable } from '@nestjs/common';

export interface ImgbbUploadResult {
  completeUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  deleteUrl: string | null;
}

@Injectable()
export class ImgbbService {
  async upload(imageBase64: string): Promise<ImgbbUploadResult> {
    const key = process.env.IMGBB_API_KEY;
    if (!key) {
      throw new Error('IMGBB_API_KEY is not configured');
    }

    const url = new URL('https://api.imgbb.com/1/upload');
    url.searchParams.set('key', key);

    const body = new FormData();
    body.append('image', imageBase64);

    const res = await fetch(url.toString(), { method: 'POST', body });
    const json = (await res.json()) as {
      success?: boolean;
      data?: {
        url?: string;
        delete_url?: string;
        image?: { url?: string };
        thumb?: { url?: string };
        medium?: { url?: string };
      };
      error?: { message?: string };
    };

    if (!json.success || !json.data) {
      const msg =
        json.error?.message || JSON.stringify(json) || 'ImgBB upload failed';
      throw new Error(msg);
    }

    const d = json.data;
    const completeUrl = d.url ?? d.image?.url ?? '';
    if (!completeUrl) {
      throw new Error('ImgBB response missing image URL');
    }

    return {
      completeUrl,
      thumbnailUrl: d.thumb?.url ?? completeUrl,
      mediumUrl: d.medium?.url ?? completeUrl,
      deleteUrl: d.delete_url ?? null,
    };
  }
}
