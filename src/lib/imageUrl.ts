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
    src.startsWith('/_next/') ||
    src.startsWith('data:') ||
    src.includes('supabase.co') ||
    src.includes('supabase.in') ||
    src.includes('drive.google.com') ||
    src.includes('googleusercontent.com') ||
    src.includes('ytimg.com') ||
    src.includes('youtube.com') ||
    src.includes('vimeo')
  ) {
    return src;
  }
  if (isCloudinaryUrl(src)) return cloudinaryThumb(src, width, quality);
  
  // Use Next.js Image Optimization endpoint with guaranteed allowed quality (75)
  const allowedWidths = [256, 384, 640, 750, 828, 1080, 1200, 1920];
  const targetWidth = allowedWidths.find((w) => w >= width) || 640;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${targetWidth}&q=75`;
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

