import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { isCategoryMatch, normalizeCategory, sanitizeMetadataText } from '@/lib/categoryUtils';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

// Helper to build MongoDB query filter for category requests
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

function mapGalleryImage(item: any): GalleryItemData {
  return {
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
  };
}

async function readAllFromMongo(): Promise<any[]> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to read gallery images.');
  }

  let mongoItems: any[] | null = null;

  try {
    mongoItems = await GalleryImage.find({}).sort({ order: 1, createdAt: -1 }).lean();
  } catch (err) {
    console.warn('[galleryStorage] Error querying GalleryImage model:', err);
  }

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

  if (!mongoItems || mongoItems.length === 0) {
    return [];
  }

  return mongoItems;
}

export async function fetchAllGalleryImages(category?: string | null): Promise<GalleryItemData[]> {
  const mongoItems = await readAllFromMongo();
  const mapped = mongoItems.map(mapGalleryImage);

  if (category && category.trim() && category.toLowerCase() !== 'all') {
    return mapped.filter((item) => isCategoryMatch(item.category, category));
  }

  return mapped;
}

export async function createGalleryImageItem(data: Partial<GalleryItemData>): Promise<GalleryItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to persist gallery image.');
  }

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

  const created: any = await GalleryImage.create(newItemData);

  // Read-after-write verification
  const fresh: any = await GalleryImage.findById(created._id).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: created gallery image was not found in MongoDB.');
  }

  return mapGalleryImage(fresh);
}

export async function updateGalleryImageItem(id: string, data: Partial<GalleryItemData>): Promise<GalleryItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to update gallery image.');
  }

  const objectId = parseObjectId(id);
  const dbUpdate: any = {
    ...(typeof data.src !== 'undefined' && { src: data.src }),
    ...(typeof data.thumbnail !== 'undefined' && { thumbnail: data.thumbnail }),
    ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
    ...(typeof data.alt !== 'undefined' && { alt: data.alt }),
    ...(typeof data.title !== 'undefined' && { title: data.title }),
    ...(typeof data.description !== 'undefined' && { description: data.description }),
    ...(typeof data.width !== 'undefined' && { width: data.width }),
    ...(typeof data.height !== 'undefined' && { height: data.height }),
    ...(typeof data.category !== 'undefined' && { category: data.category }),
    ...(typeof data.featured !== 'undefined' && { featured: data.featured }),
    ...(typeof data.order !== 'undefined' && { order: data.order }),
  };

  const updated: any = await GalleryImage.findByIdAndUpdate(objectId, dbUpdate, { new: true }).lean();
  if (!updated) {
    throw new ApiError('Gallery image not found', 404);
  }

  // Read-after-write verification
  const fresh: any = await GalleryImage.findById(objectId).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: updated gallery image was not found in MongoDB.');
  }

  return mapGalleryImage(fresh);
}

export async function deleteGalleryImageItem(id: string): Promise<boolean> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to delete gallery image.');
  }

  const objectId = parseObjectId(id);
  const deleted = await GalleryImage.deleteOne({ _id: objectId });
  if (deleted.deletedCount !== 1) {
    throw new ApiError('Gallery image not found', 404);
  }

  // Delete verification
  const check = await GalleryImage.findById(objectId).lean();
  if (check) {
    throw new Error('Delete verification failed: gallery image still exists in MongoDB.');
  }

  return true;
}
