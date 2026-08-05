export interface CompressionResult {
  file: File;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  width?: number;
  height?: number;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Client-side image compression and smart resizing for high-res photography uploads.
 * Preserves high visual fidelity (4K max dimension, high smoothing, quality 0.88)
 * while reducing multi-tens-megabyte camera files down to ~1-2 MB.
 */
export async function compressImageIfNeeded(
  file: File,
  maxDimension: number = 3840,
  quality: number = 0.88,
  onStatusUpdate?: (status: string) => void
): Promise<CompressionResult> {
  const originalSize = file.size;

  // Skip non-images, GIFs, SVGs, or files already under 1.5 MB
  if (
    !file.type.startsWith('image/') ||
    file.type === 'image/gif' ||
    file.type === 'image/svg+xml' ||
    originalSize < 1.5 * 1024 * 1024
  ) {
    return { file, compressed: false, originalSize, compressedSize: originalSize };
  }

  if (onStatusUpdate) {
    onStatusUpdate(`Optimizing photo (${formatBytes(originalSize)})...`);
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Calculate constrained dimensions keeping aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return resolve({
          file,
          compressed: false,
          originalSize,
          compressedSize: originalSize,
          width: img.width,
          height: img.height,
        });
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= originalSize) {
            // Keep original if blob compression failed or produced larger output
            return resolve({
              file,
              compressed: false,
              originalSize,
              compressedSize: originalSize,
              width: img.width,
              height: img.height,
            });
          }

          const compressedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });

          if (onStatusUpdate) {
            onStatusUpdate(`Optimized: ${formatBytes(originalSize)} -> ${formatBytes(blob.size)}`);
          }

          resolve({
            file: compressedFile,
            compressed: true,
            originalSize,
            compressedSize: blob.size,
            width,
            height,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ file, compressed: false, originalSize, compressedSize: originalSize });
    };

    img.src = objectUrl;
  });
}
