import { createClient } from '@supabase/supabase-js';

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a file strictly using the official @supabase/supabase-js Storage API:
 * 1. Calls /api/upload/init which calls createSignedUploadUrl() on the server
 * 2. Calls supabase.storage.from(bucket).uploadToSignedUrl(path, token, file) on the client
 */
export async function uploadDirectToSupabase(
  file: File,
  folder: string = 'gallery',
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (onProgress) onProgress(10);

  const initRes = await fetch('/api/upload/init', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      folder,
    }),
  });

  const initData = await initRes.json();

  if (!initRes.ok || !initData.success || !initData.token || !initData.path) {
    throw new Error(initData.error || 'Upload initialization failed');
  }

  const { path, token: uploadToken, bucket = 'images', publicUrl, apiKey, supabaseUrl } = initData;

  if (onProgress) onProgress(40);

  // Initialize official Supabase client
  const supabase = createClient(supabaseUrl, apiKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  if (onProgress) onProgress(60);

  // Upload file strictly using official Supabase Storage SDK uploadToSignedUrl API
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, uploadToken, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: true,
  });

  if (error) {
    console.error('[Supabase uploadToSignedUrl Error]', error);
    throw new Error(error.message || 'Supabase Storage upload failed');
  }

  if (onProgress) onProgress(100);

  return {
    url: publicUrl,
    publicId: path,
  };
}

export async function uploadImageDirect(
  file: File,
  folder: string = 'gallery',
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return uploadDirectToSupabase(file, folder, onProgress);
}

export async function compressImageIfNeeded(file: File): Promise<File> {
  return file;
}
