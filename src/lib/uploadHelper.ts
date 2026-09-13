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

async function uploadVideoMultipart(
  file: File,
  folder: string,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; publicId: string; fileSize: number }> {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const authHeaders = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  const initRes = await fetch('/api/upload/multipart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-upload-action': 'init', ...authHeaders },
    body: JSON.stringify({ fileName: file.name, fileType: file.type || 'video/mp4', fileSize: file.size, folder }),
  });
  const initData = await initRes.json().catch(() => ({}));
  if (!initRes.ok || !initData.uploadId) throw new Error(initData.error || `Multipart upload initialization failed (${initRes.status})`);

  const chunkSize = 3 * 1024 * 1024;
  const parts: Array<{ partNumber: number; etag: string }> = [];
  const totalParts = Math.ceil(file.size / chunkSize);
  for (let offset = 0, partNumber = 1; offset < file.size; offset += chunkSize, partNumber++) {
    const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
    const form = new FormData();
    form.append('uploadId', initData.uploadId);
    form.append('key', initData.key);
    form.append('partNumber', String(partNumber));
    form.append('chunk', chunk, file.name);
    const partRes = await fetch('/api/upload/multipart', {
      method: 'POST',
      headers: { 'x-upload-action': 'part', ...authHeaders },
      body: form,
    });
    const partData = await partRes.json().catch(() => ({}));
    if (!partRes.ok || !partData.etag) throw new Error(partData.error || `Multipart part ${partNumber} failed (${partRes.status})`);
    parts.push({ partNumber, etag: partData.etag });
    onProgress?.(20 + Math.round((partNumber / totalParts) * 70), `Uploading video (${Math.round((partNumber / totalParts) * 100)}%)...`);
  }

  const completeRes = await fetch('/api/upload/multipart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-upload-action': 'complete', ...authHeaders },
    body: JSON.stringify({ uploadId: initData.uploadId, key: initData.key, parts }),
  });
  const completeData = await completeRes.json().catch(() => ({}));
  if (!completeRes.ok || !completeData.success) throw new Error(completeData.error || `Multipart completion failed (${completeRes.status})`);

  await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    body: JSON.stringify({ url: completeData.publicUrl, publicId: initData.key, filename: file.name, originalName: file.name, size: file.size, type: file.type || 'video/mp4', folder }),
  }).catch(() => undefined);
  onProgress?.(100, 'Video upload complete!');
  return { url: completeData.publicUrl, publicId: initData.key, fileSize: file.size };
}

export async function uploadVideoDirect(
  file: File,
  folder: string = 'videos/testimonials',
  onProgress?: UploadProgressCallback
): Promise<{ url: string; publicId: string; fileSize: number; duration?: string }> {
  // 1. Client-Side Video Validation
  if (file.size > MAX_VIDEO_UPLOAD_SIZE) {
    throw new Error(
      `Video file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is ${MAX_VIDEO_UPLOAD_SIZE_MB} MB.`
    );
  }

  const isVideoMime =
    file.type.startsWith('video/') ||
    ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(file.type);
  const isVideoExt = /\.(mp4|webm|mov|m4v|mkv|ogg)$/i.test(file.name);
  if (!isVideoMime && !isVideoExt) {
    throw new Error('Invalid video format. Supported formats: MP4, WebM, MOV, M4V.');
  }

  // 2. Attempt Signed Direct Upload to Cloudflare R2 via /api/upload/init
  try {
    if (onProgress) onProgress(15, 'Initializing video upload...');
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    const initRes = await fetch('/api/upload/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'video/mp4',
        fileSize: file.size,
        folder,
      }),
    });

    if (initRes.ok) {
      const initData = await initRes.json();
      if (initData.success && initData.signedUrl && initData.signedUrl.startsWith('http')) {
        if (onProgress) onProgress(30, `Uploading video to R2 (${formatBytes(file.size)})...`);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', initData.signedUrl);
          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

          if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percent = 30 + Math.round((e.loaded / e.total) * 60);
                onProgress(percent, `Uploading video (${percent}%)...`);
              }
            });
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`R2 Direct Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during R2 video upload'));
          xhr.send(file);
        });

        if (onProgress) onProgress(92, 'Finalizing video record...');
        try {
          await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
            },
            body: JSON.stringify({
              url: initData.publicUrl,
              publicId: initData.publicId || initData.path,
              filename: file.name,
              originalName: file.name,
              size: file.size,
              type: file.type || 'video/mp4',
              folder,
            }),
          });
        } catch (e) {
          console.warn('[uploadVideoDirect] Record registration warning:', e);
        }

        if (onProgress) onProgress(100, 'Video upload complete!');
        return {
          url: initData.publicUrl,
          publicId: initData.publicId || initData.path,
          fileSize: file.size,
        };
      }
    }
    throw new Error(`R2 upload initialization failed (${initRes.status})`);
  } catch (signedErr) {
    console.warn('[uploadVideoDirect] Signed R2 upload failed; switching to chunked R2 multipart upload:', signedErr);
    if (onProgress) onProgress(10, 'Preparing chunked storage upload...');
    return uploadVideoMultipart(file, folder, onProgress);
  }

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

  if (!isVideo) {
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
  }

  // 3. Attempt Signed Upload to Cloudflare R2 via /api/upload/init
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
      if (initData.success && initData.signedUrl && initData.signedUrl.startsWith('http')) {
        if (onProgress) onProgress(35, `Uploading to R2 (${formatBytes(fileToUpload.size)})...`);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', initData.signedUrl);
          xhr.setRequestHeader('Content-Type', fileToUpload.type || 'application/octet-stream');

          if (onProgress) {
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percent = 35 + Math.round((e.loaded / e.total) * 55);
                onProgress(percent);
              }
            });
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`R2 direct upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during R2 upload'));
          xhr.send(fileToUpload);
        });

        if (onProgress) onProgress(92, 'Finalizing upload record...');
        const regRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
          },
          body: JSON.stringify({
            url: initData.publicUrl,
            publicId: initData.publicId || initData.path,
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
      }
    }
  } catch (signedErr) {
    console.warn('[uploadImageDirect] Direct upload exception, falling back to server route:', signedErr);
  }

  // 4. Server Proxy Fallback
  if (onProgress) onProgress(25, `Sending data (${formatBytes(fileToUpload.size)})...`);

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('folder', folder);
  formData.append('width', String(imageWidth));
  formData.append('height', String(imageHeight));

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

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
    if (adminToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
    }
    xhr.send(formData);
  });
}

