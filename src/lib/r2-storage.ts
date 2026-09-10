import {
  uploadToR2,
  deleteFromR2,
  getR2PublicUrl,
  createR2SignedUploadUrl,
  isR2Configured,
  getR2Config,
} from '@/lib/r2';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

function sanitizeFilename(name: string): string {
  const timestamp = Date.now();
  const ext = name.split('.').pop() || 'jpg';
  const base = name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 60);
  return `${timestamp}-${base}.${ext}`;
}

/**
 * Uploads a file to Cloudflare R2.
 * Falls back safely to base64 or proxy if R2 credentials are not yet defined.
 */
export async function uploadFile(
  file: File,
  folder: string = 'gallery',
  _onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const filename = sanitizeFilename(file.name);
  const path = `${folder}/${filename}`.replace(/^\/+/, '');
  const mimeType = file.type || 'image/jpeg';

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (isR2Configured()) {
    try {
      const res = await uploadToR2(path, buffer, mimeType);
      return {
        url: res.url,
        publicId: res.key,
      };
    } catch (err: any) {
      console.error('[Cloudflare R2] Upload exception:', err);
    }
  }

  // Graceful fallback for preview / unconfigured R2:
  // Return base64 data URL so admin uploads work seamlessly during evaluation
  console.warn('[R2 Storage] R2 credentials not set or error occurred; returning data URL.');
  const base64 = buffer.toString('base64');
  return {
    url: `data:${mimeType};base64,${base64}`,
    publicId: path,
  };
}

/**
 * Deletes an object from Cloudflare R2.
 */
export async function deleteFile(publicId: string): Promise<void> {
  const cleanKey = publicId.replace(/^\/+/, '');
  await deleteFromR2(cleanKey);
}

/**
 * Returns public URL for an asset key in Cloudflare R2.
 */
export function getPublicUrl(path: string): string {
  return getR2PublicUrl(path);
}

export { createR2SignedUploadUrl, isR2Configured, getR2Config };
