const DEFAULT_QUALITY = 80;
const ALLOWED_WIDTHS = [256, 384, 512, 640, 750, 828, 1080, 1200, 1536, 1920] as const;

function snapWidth(targetWidth: number): number {
  for (const w of ALLOWED_WIDTHS) {
    if (targetWidth <= w) return w;
  }
  return 1920;
}

export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (
    !trimmed.includes('drive.google.com') &&
    !trimmed.includes('docs.google.com') &&
    !trimmed.includes('googleusercontent.com')
  ) {
    return null;
  }

  // 1. Check for /file/d/FILE_ID or /d/FILE_ID pattern
  const fileDMatch = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // 2. Check for id=FILE_ID in query parameters (open?id=..., uc?id=...)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  return null;
}

export function isGoogleDriveUrl(url: string): boolean {
  return extractGoogleDriveFileId(url) !== null;
}

export function convertGoogleDriveUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return url;
}

function isCloudinaryUrl(src: string): boolean {
  return src.includes('res.cloudinary.com');
}

function isUnsplashUrl(src: string): boolean {
  return src.includes('images.unsplash.com');
}

function isSupabaseUrl(src: string): boolean {
  return src.includes('.supabase.co/storage/v1/');
}

export function toThumbUrl(src: unknown, width: number, quality = DEFAULT_QUALITY): string {
  if (!src) return '';
  const urlStr = typeof src === 'string' ? src : (typeof src === 'object' && src !== null && 'url' in src && typeof (src as { url?: string }).url === 'string' ? (src as { url: string }).url : '');
  if (!urlStr) return '';
  if (urlStr.startsWith('data:') || urlStr.startsWith('blob:')) return urlStr;

  // Google Drive URLs: convert and return direct export URL
  if (isGoogleDriveUrl(urlStr)) {
    return convertGoogleDriveUrl(urlStr);
  }

  const snappedWidth = snapWidth(width);

  // 1. Cloudinary URLs
  if (isCloudinaryUrl(urlStr) && urlStr.includes('/upload/')) {
    return urlStr.replace('/upload/', `/upload/w_${snappedWidth},q_${quality},f_auto/`);
  }

  // 2. Unsplash URLs
  if (isUnsplashUrl(urlStr)) {
    try {
      const url = new URL(urlStr);
      url.searchParams.set('w', snappedWidth.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('auto', 'format');
      return url.toString();
    } catch {
      return urlStr;
    }
  }

  // 3. Supabase Storage URLs (Try Render API first)
  if (isSupabaseUrl(urlStr)) {
    try {
      const renderUrl = urlStr.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      const url = new URL(renderUrl);
      url.searchParams.set('width', snappedWidth.toString());
      url.searchParams.set('quality', quality.toString());
      url.searchParams.set('format', 'webp');
      return url.toString();
    } catch {
      return `/_next/image?url=${encodeURIComponent(urlStr)}&w=${snappedWidth}&q=${quality}`;
    }
  }

  // 4. Fallback for all other external or relative HTTP URLs
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(urlStr)}&w=${snappedWidth}&q=${quality}`;
  }

  return urlStr;
}

export function toSrcSet(
  src: unknown,
  widths: readonly number[] = [384, 640, 828, 1200],
  quality = DEFAULT_QUALITY
): string {
  if (!src) return '';
  const urlStr = typeof src === 'string' ? src : (typeof src === 'object' && src !== null && 'url' in src && typeof (src as { url?: string }).url === 'string' ? (src as { url: string }).url : '');
  if (!urlStr || urlStr.startsWith('data:') || urlStr.startsWith('blob:')) return '';
  return widths.map((w) => `${toThumbUrl(urlStr, w, quality)} ${w}w`).join(', ');
}

