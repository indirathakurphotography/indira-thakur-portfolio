import { uploadImageDirect, uploadVideoDirect, UploadResult } from '@/lib/uploadHelper';

export { uploadImageDirect, uploadVideoDirect };
export type { UploadResult };

/**
 * Uploads a file directly to Cloudflare R2 using presigned PUT URL.
 */
export async function uploadDirectToR2(
  file: File,
  folder: string = 'gallery',
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return uploadImageDirect(file, folder, onProgress ? (p) => onProgress(p) : undefined);
}

/**
 * Backward compatibility alias for legacy Supabase calls.
 */
export const uploadDirectToSupabase = uploadDirectToR2;

export async function compressImageIfNeeded(file: File): Promise<File> {
  return file;
}
