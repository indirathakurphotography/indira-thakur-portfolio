const QUALITY = 75;
const WIDTHS = [384, 640, 828, 1080, 1200] as const;
const MEDIA_VERSION = '2';

function isCloudinaryUrl(src: string): boolean {
  return src.includes('res.cloudinary.com');
}

function cloudinaryThumb(src: string, width: number, quality: number): string {
  return src.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
}

export function toThumbUrl(src: string, width = 640, quality = QUALITY): string {
  if (!src) return '';
  if (src.startsWith('/api/media/')) {
    const [basePath, existingQuery] = src.split('?');
    const params = new URLSearchParams(existingQuery || '');
    if (!params.has('w')) params.set('w', String(width));
    if (!params.has('q')) params.set('q', String(quality));
    if (!params.has('v')) params.set('v', MEDIA_VERSION);
    return `${basePath}?${params.toString()}`;
  }
  if (
    src.startsWith('/') ||
    src.startsWith('data:') ||
    src.includes('drive.google.com') ||
    src.includes('googleusercontent.com') ||
    src.includes('ytimg.com') ||
    src.includes('youtube.com') ||
    src.includes('vimeo')
  ) {
    return src;
  }
  if (isCloudinaryUrl(src)) return cloudinaryThumb(src, width, quality);
  return src;
}

export function toSrcSet(src: string, widths: readonly number[] = WIDTHS, quality = QUALITY): string {
  if (!src || src.startsWith('data:')) return '';
  if (src.startsWith('/api/media/')) {
    const [basePath, existingQuery] = src.split('?');
    return widths
      .map((w) => {
        const params = new URLSearchParams(existingQuery || '');
        params.set('w', String(w));
        params.set('q', String(quality));
        if (!params.has('v')) params.set('v', MEDIA_VERSION);
        return `${basePath}?${params.toString()} ${w}w`;
      })
      .join(', ');
  }
  if (src.startsWith('/')) return '';
  if (isCloudinaryUrl(src)) {
    return widths.map((w) => `${cloudinaryThumb(src, w, quality)} ${w}w`).join(', ');
  }
  return '';
}
