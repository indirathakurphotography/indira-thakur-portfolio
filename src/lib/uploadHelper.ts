import { MAX_IMAGE_UPLOAD_SIZE, MAX_IMAGE_UPLOAD_SIZE_MB } from '@/lib/uploadConstants';

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}

export async function uploadImageDirect(
  file: File,
  folder: string = 'gallery',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum upload size is ${MAX_IMAGE_UPLOAD_SIZE_MB} MB.`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url: data.url || data.src,
            publicId: data.publicId,
            width: data.width,
            height: data.height,
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
