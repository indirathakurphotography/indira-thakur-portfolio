import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { isCategoryMatch, normalizeCategory, sanitizeMetadataText } from '@/lib/categoryUtils';

// Helper to build MongoDB query filter for category requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCategoryMongoFilter(category?: string | null): Record<string, any> {
  if (!category || !category.trim()) return {};
  const norm = normalizeCategory(category);
  if (!norm || norm === 'all') return {};

  if (norm === 'newborn') {
    return { category: { $regex: /newborn|baby|infant/i } };
  }
  if (norm === 'maternity') {
    return { category: { $regex: /maternity|pregnancy/i } };
  }
  if (norm === 'portrait' || norm === 'family') {
    return { category: { $regex: /portrait|family|families/i } };
  }
  if (norm === 'wedding') {
    return { category: { $regex: /wedding/i } };
  }
  if (norm === 'events') {
    return { category: { $regex: /event/i } };
  }
  if (norm === 'brand') {
    return { category: { $regex: /brand|collaboration|commercial|branding/i } };
  }
  return { category: { $regex: new RegExp(category.trim(), 'i') } };
}

export interface GalleryItemData {
  _id: string;
  src: string;
  thumbnail: string;
  publicId: string;
  alt: string;
  title: string;
  description: string;
  width: number;
  height: number;
  category: string;
  featured: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_GALLERY_IMAGES: GalleryItemData[] = [
  {
    _id: 'gal-maternity-1',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    publicId: 'maternity-1',
    alt: 'Maternity Fine Art Portrait in Nature',
    title: 'Maternity Fine Art Portrait in Nature',
    description: 'Bespoke maternity portrait session surrounded by soft natural light.',
    width: 800,
    height: 1000,
    category: 'Maternity',
    featured: true,
    order: 0,
  },
  {
    _id: 'gal-newborn-1',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    publicId: 'newborn-1',
    alt: 'Peaceful Newborn First Slumber',
    title: 'Peaceful Newborn First Slumber',
    description: 'Gentle certified infant safety studio session.',
    width: 800,
    height: 1000,
    category: 'Newborn',
    featured: true,
    order: 1,
  },
  {
    _id: 'gal-portrait-1',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    publicId: 'portrait-1',
    alt: 'Fine Art Black & White Portrait',
    title: 'Fine Art Black & White Portrait',
    description: 'Expressive monochrome portraiture in Mumbai studio.',
    width: 800,
    height: 1000,
    category: 'Portrait',
    featured: true,
    order: 2,
  },
  {
    _id: 'gal-wedding-1',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
    publicId: 'wedding-1',
    alt: 'Royal Wedding Heritage Portrait',
    title: 'Royal Wedding Heritage Portrait',
    description: 'Capturing unscripted traditional wedding moments.',
    width: 800,
    height: 1000,
    category: 'Wedding',
    featured: true,
    order: 3,
  },
  {
    _id: 'gal-event-1',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    publicId: 'event-1',
    alt: 'Naming Ceremony Celebration',
    title: 'Naming Ceremony Celebration',
    description: 'Precious family milestone documentations.',
    width: 800,
    height: 1000,
    category: 'Events',
    featured: false,
    order: 4,
  },
  {
    _id: 'gal-newborn-2',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
    publicId: 'newborn-2',
    alt: 'Newborn & Family Session',
    title: 'Newborn & Family Session',
    description: 'Warm family bonds with newborn baby.',
    width: 800,
    height: 1000,
    category: 'Newborn',
    featured: false,
    order: 5,
  },
  {
    _id: 'gal-maternity-2',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
    publicId: 'maternity-2',
    alt: 'Maternity Luxury Collection',
    title: 'Maternity Luxury Collection',
    description: 'Painterly maternal silhouette.',
    width: 800,
    height: 1000,
    category: 'Maternity',
    featured: false,
    order: 6,
  },
  {
    _id: 'gal-portrait-2',
    src: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    thumbnail: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    publicId: 'portrait-2',
    alt: 'Heritage Family Portrait',
    title: 'Heritage Family Portrait',
    description: 'Timeless studio portraiture.',
    width: 800,
    height: 1000,
    category: 'Family',
    featured: false,
    order: 7,
  },
];

const FALLBACK_FILE_PATH = path.join('/tmp', 'gallery_images_fallback_store.json');

let memoryStore: GalleryItemData[] | null = null;

function loadFallbackStore(): GalleryItemData[] {
  if (memoryStore !== null) {
    return memoryStore;
  }
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const content = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        memoryStore = parsed;
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('[galleryStorage] Failed reading fallback store:', err);
  }
  memoryStore = [...DEFAULT_GALLERY_IMAGES];
  saveFallbackStore(memoryStore);
  return memoryStore;
}

function saveFallbackStore(data: GalleryItemData[]) {
  memoryStore = data;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[galleryStorage] Failed writing fallback store:', err);
  }
}

export async function fetchAllGalleryImages(category?: string | null): Promise<GalleryItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      // Query master dataset so fallback store is always complete
      let mongoItems = await (GalleryImage as any).find({}).sort({ order: 1, createdAt: -1 }).lean();
      
      if (!mongoItems || mongoItems.length === 0) {
        const collectionsToCheck = ['galleryimages', 'gallery_images', 'galleries', 'gallery'];
        for (const colName of collectionsToCheck) {
          try {
            const rawItems = await db.connection.collection(colName).find({}).sort({ order: 1, createdAt: -1 }).toArray();
            if (rawItems && rawItems.length > 0) {
              mongoItems = rawItems;
              break;
            }
          } catch (colErr) {
            console.warn(`[galleryStorage] Error checking collection ${colName}:`, colErr);
          }
        }
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (mongoItems || []).map((item: any) => ({
        _id: String(item._id),
        src: item.src || '',
        thumbnail: item.thumbnail || item.src || '',
        publicId: item.publicId || '',
        alt: sanitizeMetadataText(item.alt || item.title, 'Fine Art Photography'),
        title: sanitizeMetadataText(item.title, ''),
        description: sanitizeMetadataText(item.description, ''),
        width: item.width || 800,
        height: item.height || 1000,
        category: item.category || 'Portrait',
        featured: !!item.featured,
        order: typeof item.order === 'number' ? item.order : 0,
        createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : undefined,
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
      }));

      // Always persist master dataset to fallback store
      saveFallbackStore(mapped);

      if (category && category.trim() && category.toLowerCase() !== 'all') {
        return mapped.filter((item) => isCategoryMatch(item.category, category));
      }

      return mapped;
    }
  } catch (err) {
    console.warn('[galleryStorage] MongoDB error, using fallback store:', err);
  }

  const list = loadFallbackStore();
  if (category && category.trim() && category.toLowerCase() !== 'all') {
    return list.filter((item) => isCategoryMatch(item.category, category));
  }
  return list;
}

export async function createGalleryImageItem(data: Partial<GalleryItemData>): Promise<GalleryItemData> {
  const newItemData = {
    src: data.src || '',
    thumbnail: data.thumbnail || data.src || '',
    publicId: data.publicId || '',
    alt: data.alt || data.title || '',
    title: data.title || '',
    description: data.description || '',
    width: data.width || 800,
    height: data.height || 1000,
    category: data.category || 'Portrait',
    featured: !!data.featured,
    order: typeof data.order === 'number' ? data.order : Date.now(),
  };

  try {
    const db = await connectToDatabase();
    if (db) {
      const created: any = await (GalleryImage as any).create(newItemData);
      const createdItem: GalleryItemData = {
        _id: String(created._id),
        src: created.src,
        thumbnail: created.thumbnail || created.src,
        publicId: created.publicId || '',
        alt: created.alt || '',
        title: created.title || '',
        description: created.description || '',
        width: created.width,
        height: created.height,
        category: created.category,
        featured: created.featured,
        order: created.order,
      };

      const list = loadFallbackStore();
      list.unshift(createdItem);
      saveFallbackStore(list);

      return createdItem;
    }
  } catch (err) {
    console.warn('[galleryStorage] MongoDB create failed, saving to fallback:', err);
  }

  const list = loadFallbackStore();
  const fallbackItem: GalleryItemData = {
    _id: `gal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...newItemData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.unshift(fallbackItem);
  saveFallbackStore(list);
  return fallbackItem;
}

export async function updateGalleryImageItem(id: string, data: Partial<GalleryItemData>): Promise<GalleryItemData | null> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const updated: any = await (GalleryImage as any).findByIdAndUpdate(id, data, { new: true });
      if (updated) {
        const updatedItem: GalleryItemData = {
          _id: String(updated._id),
          src: updated.src,
          thumbnail: updated.thumbnail || updated.src,
          publicId: updated.publicId || '',
          alt: updated.alt || '',
          title: updated.title || '',
          description: updated.description || '',
          width: updated.width,
          height: updated.height,
          category: updated.category,
          featured: updated.featured,
          order: updated.order,
        };

        const list = loadFallbackStore();
        const idx = list.findIndex((i) => i._id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updatedItem };
          saveFallbackStore(list);
        }

        return updatedItem;
      }
    }
  } catch (err) {
    console.warn('[galleryStorage] MongoDB update failed, using fallback:', err);
  }

  const list = loadFallbackStore();
  const idx = list.findIndex((i) => i._id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    saveFallbackStore(list);
    return list[idx];
  }
  return null;
}

export async function deleteGalleryImageItem(id: string): Promise<boolean> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const deleted = await (GalleryImage as any).findByIdAndDelete(id);
      const list = loadFallbackStore();
      const filtered = list.filter((i) => i._id !== id);
      saveFallbackStore(filtered);
      return Boolean(deleted);
    }
  } catch (err) {
    console.warn('[galleryStorage] MongoDB delete failed, using fallback:', err);
  }

  const list = loadFallbackStore();
  const filtered = list.filter((i) => i._id !== id);
  if (filtered.length !== list.length) {
    saveFallbackStore(filtered);
    return true;
  }
  return false;
}
