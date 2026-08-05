import { MAX_IMAGE_UPLOAD_SIZE, MAX_IMAGE_UPLOAD_SIZE_MB } from '@/lib/uploadConstants';
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
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${MAX_IMAGE_UPLOAD_SIZE_MB} MB.`
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

  // 3. Attempt Direct Client Upload to Supabase Storage if configured
  const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (rawSupabaseUrl && supabaseKey) {
    const baseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const filename = sanitizeFilename(fileToUpload.name);
    const path = `${folder}/${filename}`;
    const storageUrl = `${baseUrl}/storage/v1/object/images/${path}`;
    const publicUrl = `${baseUrl}/storage/v1/object/public/images/${path}`;

    try {
      if (onProgress) onProgress(20, `Uploading (${formatBytes(fileToUpload.size)})...`);

      const directResult = await new Promise<UploadResult | null>((resolve) => {
        const xhr = new XMLHttpRequest();

        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = 20 + Math.round((e.loaded / e.total) * 75);
              onProgress(percent, `Uploading (${Math.round((e.loaded / e.total) * 100)}%)...`);
            }
          });
        }

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              // Pre-uploaded successfully directly to Supabase Storage!
              // Now register record via small JSON payload to /api/files
              if (onProgress) onProgress(98, 'Finalizing upload...');
              const regRes = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: publicUrl,
                  publicId: path,
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
                return resolve({
                  url: regData.url || publicUrl,
                  publicId: regData.publicId || path,
                  width: regData.width || imageWidth,
                  height: regData.height || imageHeight,
                });
              }
            } catch (regErr) {
              console.warn('[uploadImageDirect] Registration warning:', regErr);
            }
            resolve({
              url: publicUrl,
              publicId: path,
              width: imageWidth,
              height: imageHeight,
            });
          } else {
            console.warn(`[uploadImageDirect] Direct Supabase upload HTTP ${xhr.status}, using server proxy fallback.`);
            resolve(null);
          }
        });

        xhr.addEventListener('error', () => resolve(null));
        xhr.addEventListener('abort', () => resolve(null));

        xhr.open('POST', storageUrl);
        xhr.setRequestHeader('apikey', supabaseKey);
        xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
        xhr.setRequestHeader('Content-Type', fileToUpload.type || 'application/octet-stream');
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.send(fileToUpload);
      });

      if (directResult) {
        return directResult;
      }
    } catch (directErr) {
      console.warn('[uploadImageDirect] Direct storage exception:', directErr);
    }
  }

  // 4. Server Proxy Fallback (with compressed file safely < 4.5 MB)
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

    xhr.open('POST', '/api/files');
    xhr.send(formData);
  });
}
