import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import { isCategoryMatch, normalizeCategory, sanitizeMetadataText } from '@/lib/categoryUtils';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { DEFAULT_SHOOT_GALLERY } from '@/lib/defaultGallery';

const GALLERY_CACHE_PATH = path.join(process.cwd(), '.gallery-images-cache.json');

// Helper to build MongoDB query filter for category requests
function buildCategoryMongoFilter(category?: string | null): Record<string, any> {
  if (!category || !category.trim()) return {};
  const norm = normalizeCategory(category);
  if (!norm || norm === 'all') return {};

  switch (norm) {
    case 'weddings':
      return { category: { $regex: /^wedding/i } };
    case 'maternity':
      return { category: { $regex: /^maternity/i } };
    case 'newborn':
      return { category: { $regex: /^newborn/i } };
    case 'portrait':
      return { category: { $regex: /^portrait/i } };
    case 'events':
      return { category: { $regex: /^event/i } };
    case 'toddler-child':
      return { category: { $regex: /toddler|child|milestone/i } };
    case 'brand-collaboration':
      return { category: { $regex: /brand|commercial/i } };
    case 'birth':
      return { category: { $regex: /^birth/i } };
    case 'family':
      return { category: { $regex: /^famil/i } };
    case 'couples':
      return { category: { $regex: /^couple/i } };
    default: {
      const clean = norm.replace(/[-_]+/g, ' ').trim();
      const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return { category: { $regex: new RegExp(`^${escaped}`, 'i') } };
    }
  }
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

declare global {
  var __inMemoryGallery: GalleryItemData[] | undefined;
}

function mapGalleryImage(item: any): GalleryItemData {
  return {
    _id: String(item._id || item.id || `gallery-${Date.now()}`),
    src: item.src || '',
    thumbnail: item.thumbnail || item.src || '',
    publicId: item.publicId || '',
    alt: sanitizeMetadataText(item.alt, ''),
    title: sanitizeMetadataText(item.title, ''),
    description: sanitizeMetadataText(item.description, ''),
    width: item.width || 800,
    height: item.height || 1000,
    category: item.category || '',
    featured: !!item.featured,
    order: typeof item.order === 'number' ? item.order : 0,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function readGalleryCache(): GalleryItemData[] | null {
  try {
    if (fs.existsSync(GALLERY_CACHE_PATH)) {
      const data = fs.readFileSync(GALLERY_CACHE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(mapGalleryImage);
      }
    }
  } catch {}
  return null;
}

function writeGalleryCache(items: GalleryItemData[]): void {
  try {
    fs.writeFileSync(GALLERY_CACHE_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch {}
}

function getInMemoryGallery(): GalleryItemData[] {
  if (!global.__inMemoryGallery) {
    const cached = readGalleryCache();
    if (cached) {
      global.__inMemoryGallery = cached;
      return global.__inMemoryGallery;
    }
    const defaultItems = (DEFAULT_SHOOT_GALLERY || []).map((item: any, idx: number) => ({
      ...mapGalleryImage(item),
      _id: item._id || `gallery-def-${idx + 1}`,
      order: typeof item.order === 'number' ? item.order : idx,
    }));
    global.__inMemoryGallery = defaultItems;
    writeGalleryCache(defaultItems);
  }
  return global.__inMemoryGallery;
}

function syncCache(items: GalleryItemData[]): void {
  global.__inMemoryGallery = items;
  writeGalleryCache(items);
}

async function readAllFromMongo(): Promise<any[] | null> {
  try {
    const db = await connectToDatabase();
    if (!db) return null;

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

    if (mongoItems && mongoItems.length > 0) {
      const mapped = mongoItems.map(mapGalleryImage);
      syncCache(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('[galleryStorage] MongoDB query error:', err);
  }
  return null;
}

export async function fetchAllGalleryImages(category?: string | null): Promise<GalleryItemData[]> {
  const mongoItems = await readAllFromMongo();
  const allItems = mongoItems && mongoItems.length > 0 ? mongoItems : getInMemoryGallery();

  if (category && category.trim() && category.toLowerCase() !== 'all') {
    return allItems.filter((item) => isCategoryMatch(item.category, category));
  }

  return allItems;
}

export async function fetchGalleryImagesPage(options: {
  page: number;
  limit: number;
  category?: string | null;
  featured?: boolean;
}): Promise<{ items: GalleryItemData[]; total: number }> {
  const skip = Math.max(0, (options.page - 1) * options.limit);

  try {
    const db = await connectToDatabase();
    if (db) {
      const filter: Record<string, any> = {
        ...buildCategoryMongoFilter(options.category),
        ...(options.featured ? { featured: true } : {}),
      };
      const [docs, total] = await Promise.all([
        GalleryImage.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(options.limit).lean(),
        GalleryImage.countDocuments(filter),
      ]);

      if (total > 0) {
        return { items: docs.map(mapGalleryImage), total };
      }
    }
  } catch (err) {
    console.warn('[galleryStorage] MongoDB pagination error, falling back to local storage:', err);
  }

  // Fallback to in-memory / local cache
  const allItems = await fetchAllGalleryImages(options.category);
  const featuredItems = options.featured ? allItems.filter((item) => item.featured) : allItems;
  return {
    items: featuredItems.slice(skip, skip + options.limit),
    total: featuredItems.length,
  };
}

export async function createGalleryImageItem(data: Partial<GalleryItemData>): Promise<GalleryItemData> {
  assertNoProhibitedLanguage(data);

  const newItemData: GalleryItemData = {
    _id: `gallery-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    src: data.src || '',
    thumbnail: data.thumbnail || data.src || '',
    publicId: data.publicId || '',
    alt: data.alt || '',
    title: data.title || '',
    description: data.description || '',
    width: data.width || 800,
    height: data.height || 1000,
    category: data.category || '',
    featured: !!data.featured,
    order: typeof data.order !== 'undefined' ? Number(data.order) : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Try MongoDB if available
  let createdFromMongo: GalleryItemData | null = null;
  try {
    const db = await connectToDatabase();
    if (db) {
      const created: any = await GalleryImage.create({
        src: newItemData.src,
        publicId: newItemData.publicId,
        alt: newItemData.alt,
        title: newItemData.title,
        description: newItemData.description,
        width: newItemData.width,
        height: newItemData.height,
        category: newItemData.category,
        featured: newItemData.featured,
        order: newItemData.order,
      } as any);
      if (created?._id) {
        const fresh: any = await GalleryImage.findById(created._id).lean();
        if (fresh) {
          createdFromMongo = mapGalleryImage(fresh);
        }
      }
    }
  } catch (mongoErr) {
    console.warn('[galleryStorage] MongoDB insert unavailable, saving locally:', mongoErr);
  }

  const result = createdFromMongo || newItemData;
  const current = getInMemoryGallery();
  const updated = [result, ...current.filter((item) => item._id !== result._id)];
  syncCache(updated);

  return result;
}

export async function updateGalleryImageItem(id: string, data: Partial<GalleryItemData>): Promise<GalleryItemData> {
  assertNoProhibitedLanguage(data);
  if (!id) throw new ApiError('Image ID is required', 400);

  let updatedItem: GalleryItemData | null = null;

  // Try MongoDB if available
  try {
    const db = await connectToDatabase();
    if (db && /^[0-9a-fA-F]{24}$/.test(id)) {
      const objectId = parseObjectId(id);
      const dbUpdate: any = {
        ...(typeof data.src !== 'undefined' && { src: data.src }),
        ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
        ...(typeof data.alt !== 'undefined' && { alt: data.alt }),
        ...(typeof data.title !== 'undefined' && { title: data.title }),
        ...(typeof data.description !== 'undefined' && { description: data.description }),
        ...(typeof data.width !== 'undefined' && { width: data.width }),
        ...(typeof data.height !== 'undefined' && { height: data.height }),
        ...(typeof data.category !== 'undefined' && { category: data.category }),
        ...(typeof data.featured !== 'undefined' && { featured: data.featured }),
        ...(typeof data.order !== 'undefined' && { order: Number(data.order) }),
      };
      const updatedMongo = await GalleryImage.findByIdAndUpdate(objectId, dbUpdate, { new: true }).lean();
      if (updatedMongo) {
        updatedItem = mapGalleryImage(updatedMongo);
      }
    }
  } catch (mongoErr) {
    console.warn('[galleryStorage] MongoDB update unavailable, updating locally:', mongoErr);
  }

  // Update in local cache
  const current = getInMemoryGallery();
  const idx = current.findIndex((item) => item._id === id || String(item._id) === String(id));
  if (idx === -1 && !updatedItem) {
    throw new ApiError('Gallery image not found', 404);
  }

  if (idx !== -1) {
    const existing = current[idx];
    const merged: GalleryItemData = {
      ...existing,
      ...(updatedItem || {}),
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
      ...(typeof data.order !== 'undefined' && { order: Number(data.order) }),
      updatedAt: new Date().toISOString(),
    };
    current[idx] = merged;
    syncCache([...current]);
    return merged;
  }

  if (updatedItem) {
    syncCache([updatedItem, ...current.filter((item) => item._id !== updatedItem?._id)]);
    return updatedItem;
  }

  throw new ApiError('Gallery image not found', 404);
}

export async function deleteGalleryImageItem(id: string): Promise<boolean> {
  if (!id) throw new ApiError('Image ID is required', 400);

  // Try MongoDB if available
  try {
    const db = await connectToDatabase();
    if (db && /^[0-9a-fA-F]{24}$/.test(id)) {
      const objectId = parseObjectId(id);
      await GalleryImage.deleteOne({ _id: objectId });
    }
  } catch (mongoErr) {
    console.warn('[galleryStorage] MongoDB delete unavailable, deleting locally:', mongoErr);
  }

  const current = getInMemoryGallery();
  const filtered = current.filter((item) => item._id !== id && String(item._id) !== String(id));
  syncCache(filtered);

  return true;
}

export async function reorderGalleryImages(orders: Array<{ id?: string; _id?: string; order: number }>): Promise<void> {
  if (!Array.isArray(orders) || orders.length === 0) return;

  // Try MongoDB bulkWrite if available
  try {
    const db = await connectToDatabase();
    if (db) {
      const ops = orders
        .map((o) => ({ id: o.id || o._id, order: o.order }))
        .filter((o) => o.id && /^[0-9a-fA-F]{24}$/.test(o.id))
        .map((o) => ({
          updateOne: {
            filter: { _id: parseObjectId(o.id!) },
            update: { $set: { order: Number(o.order) } },
          },
        }));
      if (ops.length > 0) {
        await GalleryImage.bulkWrite(ops);
      }
    }
  } catch (mongoErr) {
    console.warn('[galleryStorage] MongoDB bulkWrite unavailable for reordering:', mongoErr);
  }

  // Always update local memory & cache
  const current = getInMemoryGallery();
  const orderMap = new Map<string, number>();
  for (const o of orders) {
    const key = o.id || o._id;
    if (key) {
      orderMap.set(String(key), Number(o.order));
    }
  }

  for (const item of current) {
    if (orderMap.has(String(item._id))) {
      item.order = orderMap.get(String(item._id))!;
      item.updatedAt = new Date().toISOString();
    }
  }

  current.sort((a, b) => a.order - b.order);
  syncCache([...current]);
}
