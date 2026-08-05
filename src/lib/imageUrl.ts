const QUALITY = 85;
const WIDTHS = [400, 800, 1200] as const;

function isCloudinaryUrl(src: string): boolean {
  return src.includes('res.cloudinary.com');
}

function cloudinaryThumb(src: string, width: number, quality: number): string {
  return src.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
}

function supabaseThumb(src: string, width: number, quality: number): string {
  return src.replace('/object/', '/render/image/') + `?width=${width}&quality=${quality}&format=origin`;
}

export function toThumbUrl(src: string, width: number, quality = QUALITY): string {
  if (!src) return '';
  if (isCloudinaryUrl(src)) return cloudinaryThumb(src, width, quality);
  return supabaseThumb(src, width, quality);
}

export function toSrcSet(src: string, widths: readonly number[] = WIDTHS, quality = QUALITY): string {
  if (!src) return '';
  return widths.map((w) => `${toThumbUrl(src, w, quality)} ${w}w`).join(', ');
}
