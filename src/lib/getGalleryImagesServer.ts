import GalleryImage from '@/models/GalleryImage';
import { requireDatabase } from '@/lib/cmsDatabase';
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
}

const serverGalleryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function clearServerGalleryCache(): void {
  serverGalleryCache.clear();
}

export async function getGalleryImagesServer(category?: string | null, limit = 1000): Promise<GalleryItem[]> {
  const normCat = category ? normalizeCategory(category) : '';
  const cacheKey = `${normCat || 'ALL'}_${limit}`;
  const now = Date.now();
  const cached = serverGalleryCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    await requireDatabase();
    const query = category ? { category } : {};
    const rawItems = await (GalleryImage as any).find(query).sort({ order: 1, createdAt: -1 }).limit(limit).lean();
    const mapped = mapRawImagesToGalleryItems(rawItems as RawImageRecord[]);
    serverGalleryCache.set(cacheKey, { timestamp: now, data: mapped });
    return mapped;
  } catch (error) {
    console.error('getGalleryImagesServer error:', error);
    throw error;
  }
}
