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
  } catch (signedErr) {
    console.warn('[uploadVideoDirect] Signed upload exception, using proxy fallback:', signedErr);
  }

  // 3. Fallback: Direct POST to /api/upload/video
  if (onProgress) onProgress(20, `Uploading video file (${formatBytes(file.size)})...`);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = 20 + Math.round((e.loaded / e.total) * 75);
          onProgress(percent, `Uploading video (${percent}%)...`);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (onProgress) onProgress(100, 'Video upload complete!');
          resolve({
            url: data.videoUrl || data.url,
            publicId: data.publicId || '',
            fileSize: data.fileSize || file.size,
            duration: data.duration,
          });
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || `Video upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Video upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during video upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Video upload cancelled'));
    });

    xhr.open('POST', '/api/upload/video');
    if (adminToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
    }
    xhr.send(formData);
  });
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
