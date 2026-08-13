import { fetchAllGalleryImages } from '@/lib/galleryStorage';
import { toSrcSet } from '@/lib/imageUrl';
import { sanitizeMetadataText, normalizeCategory } from '@/lib/categoryUtils';

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

export interface RawImageRecord {
  _id?: unknown;
  id?: string;
  src?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  category?: string;
  shoot?: string;
  title?: string;
  alt?: string;
  description?: string;
  caption?: string;
}

export function mapRawImagesToGalleryItems(items: RawImageRecord[]): GalleryItem[] {
  return (items || [])
    .filter((img) => img && (img.src || img.thumbnail))
    .map((img, idx) => {
      const srcUrl = img.src || img.thumbnail || '';
      const docId = img._id ? String(img._id) : (img.id ? String(img.id) : `img-${idx}`);
      const rawWidth = typeof img.width === 'number' && img.width > 0 ? img.width : 800;
      const rawHeight = typeof img.height === 'number' && img.height > 0 ? img.height : 1000;
      return {
        id: docId,
        src: srcUrl,
        thumbSrcSet: toSrcSet(srcUrl),
        alt: sanitizeMetadataText(img.alt || img.title, 'Fine Art Photography'),
        width: rawWidth,
        height: rawHeight,
        category: img.category || '',
        shoot: img.shoot || '',
        title: sanitizeMetadataText(img.title || img.alt, ''),
        caption: sanitizeMetadataText(img.description || img.caption, ''),
        aspectRatio: rawWidth / rawHeight,
      };
    });
}

interface CacheEntry {
  timestamp: number;
  data: GalleryItem[];
  isFallback: boolean;
}

const serverGalleryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function isFallbackGalleryItems(items: GalleryItem[]): boolean {
  if (!items || items.length === 0) return true;
  return items.some((img) => String(img.id || '').startsWith('gal-'));
}

export function clearServerGalleryCache(): void {
  serverGalleryCache.clear();
}

export async function getGalleryImagesServer(category?: string | null, limit = 1000): Promise<GalleryItem[]> {
  const normCat = category ? normalizeCategory(category) : '';
  const cacheKey = `${normCat || 'ALL'}_${limit}`;
  const now = Date.now();
  const cached = serverGalleryCache.get(cacheKey);

  if (cached && !cached.isFallback && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const rawItems = await fetchAllGalleryImages(category);
    const sliced = rawItems.slice(0, limit);
    const mapped = mapRawImagesToGalleryItems(sliced as RawImageRecord[]);
    const isFallback = isFallbackGalleryItems(mapped);

    if (!isFallback && mapped.length > 0) {
      serverGalleryCache.set(cacheKey, { timestamp: now, data: mapped, isFallback: false });
    }
    return mapped;
  } catch (error) {
    console.error('getGalleryImagesServer error:', error);
    return [];
  }
}
