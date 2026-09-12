import { unstable_cache, revalidateTag } from 'next/cache';
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
  const seenSrcs = new Set<string>();
  const seenIds = new Set<string>();
  const result: GalleryItem[] = [];

  for (const img of items || []) {
    if (!img || (!img.src && !img.thumbnail)) continue;
    const srcUrl = (img.src || img.thumbnail || '').trim();
    if (!srcUrl || seenSrcs.has(srcUrl)) continue;
    seenSrcs.add(srcUrl);

    const docId = img._id
      ? String(img._id)
      : img.id
      ? String(img.id)
      : `img-${srcUrl.split('/').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'unknown'}`;

    if (seenIds.has(docId)) continue;
    seenIds.add(docId);

    const rawWidth = typeof img.width === 'number' && img.width > 0 ? img.width : 800;
    const rawHeight = typeof img.height === 'number' && img.height > 0 ? img.height : 1000;

    let category = img.category || '';
    const textToCheck = `${img.title || ''} ${img.alt || ''} ${img.description || ''} ${img.caption || ''} ${img.shoot || ''} ${srcUrl}`.toLowerCase();
    if (textToCheck.includes('red bull') || textToCheck.includes('redbull')) {
      category = 'brand-collaboration';
    }

    result.push({
      id: docId,
      src: srcUrl,
      thumbSrcSet: toSrcSet(srcUrl),
      alt: sanitizeMetadataText(img.alt, ''),
      width: rawWidth,
      height: rawHeight,
      category,
      shoot: img.shoot || '',
      title: sanitizeMetadataText(img.title, ''),
      caption: sanitizeMetadataText(img.caption || img.description, ''),
      aspectRatio: rawWidth / rawHeight,
    });
  }

  return result;
}

async function getCachedRawGalleryImages(category?: string | null) {
  const norm = normalizeCategory(category) || 'all';
  return unstable_cache(
    async () => fetchAllGalleryImages(category),
    ['public-gallery-images', norm],
    {
      revalidate: 300,
      tags: ['gallery', `gallery-${norm}`],
    }
  )();
}

export function clearServerGalleryCache(): void {
  // CMS writes call this helper through triggerRevalidation(), so a published
  // image change is visible immediately instead of waiting for the five-minute
  // read cache to expire.
  try {
    revalidateTag('gallery', 'default');
  } catch {}
}

export async function getGalleryImagesServer(category?: string | null, limit = 1000): Promise<GalleryItem[]> {
  try {
    const rawItems = await getCachedRawGalleryImages(category || null);
    const sliced = rawItems.slice(0, limit);
    return mapRawImagesToGalleryItems(sliced as RawImageRecord[]);
  } catch (error) {
    console.error('getGalleryImagesServer error:', error);
    return [];
  }
}
