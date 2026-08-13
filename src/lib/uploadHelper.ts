import {
  MAX_IMAGE_UPLOAD_SIZE,
  MAX_IMAGE_UPLOAD_SIZE_MB,
  MAX_VIDEO_UPLOAD_SIZE,
  MAX_VIDEO_UPLOAD_SIZE_MB,
} from '@/lib/uploadConstants';
import { compressImageIfNeeded, formatBytes } from '@/lib/compressImage';

export interface UploadProgressCallback {
  (progress: number, status?: string): void;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

function sanitizeFilename(name: string): string {
  const timestamp = Date.now();
  const ext = name.split('.').pop() || 'jpg';
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
  return `${timestamp}-${base}.${ext}`;
}

export async function uploadImageDirect(
  file: File,
  folder: string = 'gallery',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  // 1. Client-Side Validation
  const isVideo = file.type.startsWith('video/');
  const maxAllowedSize = isVideo ? MAX_VIDEO_UPLOAD_SIZE : MAX_IMAGE_UPLOAD_SIZE;
  const maxAllowedSizeMb = isVideo ? MAX_VIDEO_UPLOAD_SIZE_MB : MAX_IMAGE_UPLOAD_SIZE_MB;

  if (file.size > maxAllowedSize) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${maxAllowedSizeMb} MB.`
    );
  }

  // 2. Client-Side Intelligent Compression for Large Photos
  let fileToUpload = file;
  let imageWidth = 1200;
  let imageHeight = 1600;

  try {
    const compResult = await compressImageIfNeeded(file, 3840, 0.88, (statusMsg) => {
      if (onProgress) onProgress(10, statusMsg);
    });
    fileToUpload = compResult.file;
    if (compResult.width) imageWidth = compResult.width;
    if (compResult.height) imageHeight = compResult.height;
  } catch (compErr) {
    console.warn('[uploadImageDirect] Client compression warning:', compErr);
  }

  // 3. Attempt Signed Upload via /api/upload/init to upload directly to Supabase Storage (bypassing Vercel proxy body limit)
  try {
    if (onProgress) onProgress(15, 'Initializing storage upload...');
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const initRes = await fetch('/api/upload/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size,
        folder,
      }),
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      if (initData.success && initData.token && initData.path && initData.supabaseUrl) {
        if (onProgress) onProgress(35, `Uploading (${formatBytes(fileToUpload.size)})...`);

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(initData.supabaseUrl, initData.apiKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });

        const { error: uploadError } = await supabase.storage
          .from(initData.bucket || 'images')
          .uploadToSignedUrl(initData.path, initData.token, fileToUpload, {
            contentType: fileToUpload.type || 'application/octet-stream',
            upsert: true,
          });

        if (!uploadError) {
          if (onProgress) onProgress(90, 'Finalizing upload record...');
          const regRes = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
            },
            body: JSON.stringify({
              url: initData.publicUrl,
              publicId: initData.path,
              filename: fileToUpload.name,
              originalName: file.name,
              size: fileToUpload.size,
              type: fileToUpload.type,
              folder,
              width: imageWidth,
              height: imageHeight,
            }),
          });

          if (regRes.ok) {
            const regData = await regRes.json();
            if (onProgress) onProgress(100, 'Upload complete!');
            return {
              url: regData.url || regData.src || initData.publicUrl,
              publicId: regData.publicId || initData.path,
              width: regData.width || imageWidth,
              height: regData.height || imageHeight,
            };
          }

          if (onProgress) onProgress(100, 'Upload complete!');
          return {
            url: initData.publicUrl,
            publicId: initData.path,
            width: imageWidth,
            height: imageHeight,
          };
        } else {
          console.warn('[uploadImageDirect] uploadToSignedUrl error:', uploadError.message);
        }
      }
    } else {
      const errText = await initRes.text();
      console.warn('[uploadImageDirect] /api/upload/init failed with status:', initRes.status, errText);
    }
  } catch (signedErr) {
    console.warn('[uploadImageDirect] Signed upload exception:', signedErr);
  }

  // 4. Server Proxy Fallback — Strictly enforced maximum 4.5 MB Vercel payload limit
  const VERCEL_MAX_BODY_BYTES = 4.5 * 1024 * 1024;
  if (fileToUpload.size >= VERCEL_MAX_BODY_BYTES) {
    throw new Error(
      `File size (${formatBytes(fileToUpload.size)}) exceeds server proxy limit (4.5 MB) and direct storage upload could not be initialized. Please ensure admin session is active.`
    );
  }

  if (onProgress) onProgress(25, `Sending data (${formatBytes(fileToUpload.size)})...`);

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('folder', folder);
  formData.append('width', String(imageWidth));
  formData.append('height', String(imageHeight));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = 25 + Math.round((e.loaded / e.total) * 70);
          onProgress(percent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100, 'Upload complete!');
          resolve({
            url: data.url || data.src,
            publicId: data.publicId,
            width: data.width || imageWidth,
            height: data.height || imageHeight,
          });
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}
