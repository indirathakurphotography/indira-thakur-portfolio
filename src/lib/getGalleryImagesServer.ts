import { fetchAllGalleryImages } from '@/lib/galleryStorage';
import { toSrcSet } from '@/lib/imageUrl';
import { sanitizeMetadataText } from '@/lib/categoryUtils';

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

export function clearServerGalleryCache(): void {
  // No server-side cache is retained; the public gallery always reads
  // MongoDB directly so admin edits appear immediately.
}

export async function getGalleryImagesServer(category?: string | null, limit = 1000): Promise<GalleryItem[]> {
  try {
    const rawItems = await fetchAllGalleryImages(category);
    const sliced = rawItems.slice(0, limit);
    const mapped = mapRawImagesToGalleryItems(sliced as RawImageRecord[]);
    return mapped;
  } catch (error) {
    console.error('getGalleryImagesServer error:', error);
    return [];
  }
}
