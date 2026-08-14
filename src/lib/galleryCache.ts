import { toThumbUrl, toSrcSet } from '@/lib/imageUrl';
import { sanitizeMetadataText } from '@/lib/categoryUtils';

export interface GalleryImage {
  id?: string;
  _id?: string;
  src: string;
  alt?: string;
  width: number;
  height: number;
  category: string;
  shoot?: string;
  title?: string;
  description?: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  thumbSrcSet: string;
  alt: string;
  width: number;
  height: number;
  category: string;
  shoot?: string;
  title?: string;
  caption?: string;
  aspectRatio: number;
}

export function normalizeCategory(cat?: string): string {
  if (!cat) return '';
  const trimmed = cat.toLowerCase().trim();
  if (trimmed.includes('maternity') || trimmed.includes('motherhood')) return 'maternity';
  if (trimmed.includes('newborn') || trimmed.includes('baby') || trimmed.includes('birth') || trimmed.includes('child')) return 'newborn';
  if (trimmed.includes('portrait') || trimmed.includes('family') || trimmed.includes('fine art') || trimmed.includes('fine-art')) return 'portrait';
  if (trimmed.includes('event') || trimmed.includes('gala') || trimmed.includes('celebration')) return 'events';
  if (trimmed.includes('wedding') || trimmed.includes('nuptial')) return 'wedding';
  if (trimmed.includes('couple')) return 'couple';
  if (trimmed.includes('film')) return 'films';
  if (trimmed.includes('brand') || trimmed.includes('collaborat') || trimmed.includes('corporate')) return 'brand collaboration';
  return trimmed;
}

export function formatCategory(raw?: string): string {
  if (!raw) return '';
  const normalized = normalizeCategory(raw);
  const displayNames: Record<string, string> = {
    newborn: 'Newborn',
    maternity: 'Maternity',
    family: 'Family',
    'brand collaboration': 'Brand',
    portrait: 'Portraits',
    wedding: 'Weddings',
    events: 'Events',
    couple: 'Couples',
    films: 'Films',
  };
  return displayNames[normalized] || raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function mapGalleryImages(images: GalleryImage[]): GalleryItem[] {
  return images
    .filter((img) => img && (img.src || (img as any).thumbnail))
    .map((img, idx) => {
      const srcUrl = img.src || (img as any).thumbnail || '';
      const rawWidth = typeof img.width === 'number' && img.width > 0 ? img.width : 800;
      const rawHeight = typeof img.height === 'number' && img.height > 0 ? img.height : 1000;
      const docId = img.id || (img as any)._id?.toString();
      const uniqueId = docId ? `${docId}-${idx}` : `gallery-img-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id: uniqueId,
        src: srcUrl,
        thumbSrcSet: toSrcSet(srcUrl),
        alt: sanitizeMetadataText(img.alt || img.title, 'Fine Art Photography'),
        width: rawWidth,
        height: rawHeight,
        category: (img.category || '').trim(),
        shoot: sanitizeMetadataText(img.shoot, ''),
        title: sanitizeMetadataText(img.title, ''),
        caption: sanitizeMetadataText(img.description, ''),
        aspectRatio: rawWidth / rawHeight,
      };
    });
}

// NOTE: no module-level cache is retained; see fetchGalleryImages below.
// (A memory cache used to serve stale gallery data after admin edits.)

export function getCachedGalleryItems(): GalleryItem[] | null {
  return null;
}

export function getCachedRawGallery(): GalleryImage[] | null {
  return null;
}

export function invalidateGalleryCache(): void {
  // No client-side cache is retained; gallery data is always fetched fresh
  // from the API so admin edits are visible immediately.
}

export async function fetchGalleryImages(): Promise<{ raw: GalleryImage[]; items: GalleryItem[] }> {
  try {
    const res = await fetch('/api/gallery-images?page=1&limit=1000', { cache: 'no-store' });
    if (!res.ok) return { raw: [], items: [] };
    const json = await res.json();
    const data: GalleryImage[] = json.items || (Array.isArray(json) ? json : []);
    const items = mapGalleryImages(data);
    if (typeof window !== 'undefined' && items.length > 0) {
      items.slice(0, 6).forEach((item) => {
        const img = new Image();
        img.src = toThumbUrl(item.src, 600, 80);
      });
    }
    return { raw: data, items };
  } catch {
    return { raw: [], items: [] };
  }
}
