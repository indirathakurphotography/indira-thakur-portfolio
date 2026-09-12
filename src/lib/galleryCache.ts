import { toThumbUrl, toSrcSet } from '@/lib/imageUrl';
import { sanitizeMetadataText, normalizeCategory, formatCategory } from '@/lib/categoryUtils';
import { dedupeGalleryRecords, getStableGalleryRecordId } from '@/lib/galleryIdentity';

export { normalizeCategory, formatCategory };

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

export function mapGalleryImages(images: GalleryImage[]): GalleryItem[] {
  return dedupeGalleryRecords(images || [])
    .filter((img) => img && (img.src || (img as any).thumbnail))
    .map((img) => {
      const srcUrl = img.src || (img as any).thumbnail || '';
      const rawWidth = typeof img.width === 'number' && img.width > 0 ? img.width : 800;
      const rawHeight = typeof img.height === 'number' && img.height > 0 ? img.height : 1000;
      const uniqueId = getStableGalleryRecordId(img);
      return {
        id: uniqueId,
        src: srcUrl,
        thumbSrcSet: toSrcSet(srcUrl),
        alt: sanitizeMetadataText(img.alt, ''),
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
