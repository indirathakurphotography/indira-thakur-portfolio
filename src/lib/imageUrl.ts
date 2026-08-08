const QUALITY = 75;
const WIDTHS = [384, 640, 828, 1080, 1200] as const;

function isCloudinaryUrl(src: string): boolean {
  return src.includes('res.cloudinary.com');
}

function cloudinaryThumb(src: string, width: number, quality: number): string {
  return src.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
}

export function toThumbUrl(src: string, width = 640, quality = QUALITY): string {
  if (!src) return '';
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:') ||
    src.startsWith('/_next/')
  ) {
    if (isCloudinaryUrl(src)) return cloudinaryThumb(src, width, quality);
    return src;
  }
  return src;
}

export function toSrcSet(src: string, widths: readonly number[] = WIDTHS, quality = QUALITY): string {
  if (!src) return '';
  if (src.includes('supabase.co') || src.includes('supabase.in') || src.startsWith('data:') || src.startsWith('/_next/')) {
    return '';
  }
  if (isCloudinaryUrl(src)) {
    return widths.map((w) => `${cloudinaryThumb(src, w, quality)} ${w}w`).join(', ');
  }
  return widths.map((w) => `${toThumbUrl(src, w, quality)} ${w}w`).join(', ');
}

