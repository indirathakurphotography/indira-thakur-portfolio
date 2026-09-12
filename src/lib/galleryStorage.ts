import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import GalleryImage from '@/models/GalleryImage';
import Gallery from '@/models/Gallery';
import FileRecord from '@/models/FileRecord';
import { deleteFromR2 } from '@/lib/r2';
import { triggerRevalidation } from '@/lib/revalidate';
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
  let category = item.category || '';
  const textToCheck = `${item.title || ''} ${item.alt || ''} ${item.description || ''} ${item.caption || ''} ${item.src || ''} ${item.shoot || ''}`.toLowerCase();
  if (textToCheck.includes('red bull') || textToCheck.includes('redbull')) {
    category = 'brand-collaboration';
  }

  return {
    _id: String(item._id || item.id || `gallery-${Date.now()}`),
    src: item.src || '',
    thumbnail: item.thumbnail || item.src || '',
    publicId: item.publicId || '',
    alt: sanitizeMetadataText(item.alt, ''),
    title: sanitizeMetadataText(item.title, ''),
    description: sanitizeMetadataText(item.description || item.caption, ''),
    width: item.width || 800,
    height: item.height || 1000,
    category,
    featured: !!item.featured,
    order: typeof item.order === 'number' ? item.order : 0,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function extractR2Key(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed.startsWith('data:')) return null;

  // If it's already a clean relative key (e.g. 'gallery/1785...jpg' or 'uploads/...')
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
    return trimmed;
  }

  // If it contains /api/media/
  if (trimmed.includes('/api/media/')) {
    const parts = trimmed.split('/api/media/');
    return parts[1] ? parts[1].replace(/^\/+/, '') : null;
  }

  // If it's an R2 or domain URL
  try {
    const urlObj = new URL(trimmed);
    const host = urlObj.hostname.toLowerCase();
    if (
      host.includes('r2.dev') ||
      host.includes('r2.cloudflarestorage.com') ||
      host.includes('indirathakurphotography.com')
    ) {
      const pathKey = urlObj.pathname.replace(/^\/+/, '');
      return pathKey || null;
    }
  } catch {}

  return null;
}

function readGalleryCache(): GalleryItemData[] | null {
  try {
    if (fs.existsSync(GALLERY_CACHE_PATH)) {
      const data = fs.readFileSync(GALLERY_CACHE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
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

let serverGalleryCache: GalleryItemData[] | null = null;
let serverGalleryCacheTime = 0;
const SERVER_GALLERY_TTL = 60 * 1000; // 60s in-memory TTL

export function clearServerGalleryStorageCache(): void {
  serverGalleryCache = null;
  serverGalleryCacheTime = 0;
}

function syncCache(items: GalleryItemData[]): void {
  serverGalleryCache = items;
  serverGalleryCacheTime = Date.now();
  global.__inMemoryGallery = items;
  writeGalleryCache(items);
}

async function readAllFromMongo(): Promise<any[] | null> {
  const now = Date.now();
  if (serverGalleryCache && now - serverGalleryCacheTime < SERVER_GALLERY_TTL) {
    return serverGalleryCache;
  }

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

    // Auto-migrate: associate any Red Bull image in MongoDB with Brand Collaboration
    try {
      await (GalleryImage as any).updateMany(
        {
          $or: [
            { title: /red\s*bull/i },
            { alt: /red\s*bull/i },
            { description: /red\s*bull/i },
            { src: /red\s*bull/i },
          ],
          category: { $ne: 'brand-collaboration' },
        },
        { $set: { category: 'brand-collaboration' } }
      );
    } catch {}

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

      // Check if MongoDB has documents in the collection
      const totalInDb = await GalleryImage.countDocuments({}).catch(() => 0);
      if (totalInDb > 0) {
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

  const cleanCategory = data.category ? normalizeCategory(data.category) : '';
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
    category: cleanCategory || data.category || '',
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
      // Check if an existing document already exists with this src or publicId
      // (prevents duplicate documents if /api/upload already created one)
      const existingQueries: any[] = [];
      if (newItemData.src) existingQueries.push({ src: newItemData.src });
      if (newItemData.publicId) existingQueries.push({ publicId: newItemData.publicId });

      let existing: any = existingQueries.length > 0
        ? await GalleryImage.findOne({ $or: existingQueries } as any)
        : null;

      if (existing) {
        existing.category = newItemData.category || existing.category;
        existing.title = newItemData.title || existing.title;
        existing.alt = newItemData.alt || existing.alt;
        existing.description = newItemData.description || existing.description;
        existing.width = newItemData.width || existing.width;
        existing.height = newItemData.height || existing.height;
        existing.order = typeof newItemData.order === 'number' ? newItemData.order : existing.order;
        if (typeof newItemData.featured !== 'undefined') existing.featured = newItemData.featured;
        await existing.save();
        createdFromMongo = mapGalleryImage(existing.toObject());
      } else {
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
    }
  } catch (mongoErr) {
    console.warn('[galleryStorage] MongoDB insert unavailable, saving locally:', mongoErr);
  }

  const result = createdFromMongo || newItemData;
  const current = getInMemoryGallery();
  const updated = [
    result,
    ...current.filter((item) => item._id !== result._id && (!result.src || item.src !== result.src)),
  ];
  syncCache(updated);

  triggerRevalidation();

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
        ...(typeof data.category !== 'undefined' && {
          category: normalizeCategory(data.category) || data.category,
        }),
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
      ...(typeof data.category !== 'undefined' && {
        category: normalizeCategory(data.category) || data.category,
      }),
      ...(typeof data.featured !== 'undefined' && { featured: data.featured }),
      ...(typeof data.order !== 'undefined' && { order: Number(data.order) }),
      updatedAt: new Date().toISOString(),
    };
    current[idx] = merged;
    syncCache([...current]);
    triggerRevalidation();
    return merged;
  }

  if (updatedItem) {
    syncCache([updatedItem, ...current.filter((item) => item._id !== updatedItem?._id)]);
    triggerRevalidation();
    return updatedItem;
  }

  throw new ApiError('Gallery image not found', 404);
}

export async function deleteGalleryImageItem(id: string): Promise<boolean> {
  if (!id) throw new ApiError('Image ID is required', 400);

  const docIdsToPurge = new Set<string>();
  const srcsToPurge = new Set<string>();
  const publicIdsToPurge = new Set<string>();
  const r2KeysToDelete = new Set<string>();

  docIdsToPurge.add(id);

  // Check in-memory items (find all matching records)
  const inMemoryMatches = getInMemoryGallery().filter(
    (item) => item._id === id || String(item._id) === String(id) || (item as any).id === id || item.publicId === id || item.src === id
  );
  for (const item of inMemoryMatches) {
    if (item._id) docIdsToPurge.add(String(item._id));
    if ((item as any).id) docIdsToPurge.add(String((item as any).id));
    if (item.src) srcsToPurge.add(item.src);
    if (item.publicId) publicIdsToPurge.add(item.publicId);
    const key = extractR2Key(item.publicId) || extractR2Key(item.src);
    if (key) r2KeysToDelete.add(key);
  }

  // Also inspect disk cache directly
  const cacheItems = readGalleryCache() || [];
  const cacheMatches = cacheItems.filter(
    (item) => item._id === id || String(item._id) === String(id) || (item as any).id === id || item.publicId === id || item.src === id
  );
  for (const item of cacheMatches) {
    if (item._id) docIdsToPurge.add(String(item._id));
    if ((item as any).id) docIdsToPurge.add(String((item as any).id));
    if (item.src) srcsToPurge.add(item.src);
    if (item.publicId) publicIdsToPurge.add(item.publicId);
    const key = extractR2Key(item.publicId) || extractR2Key(item.src);
    if (key) r2KeysToDelete.add(key);
  }

  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

  // Try MongoDB if available
  try {
    const db = await connectToDatabase();
    if (db) {
      const orClauses: any[] = [{ src: id }, { publicId: id }];
      if (isObjectId) {
        orClauses.push({ _id: parseObjectId(id) });
      }
      orClauses.push({ _id: id });

      // 1. Find matching docs in GalleryImage
      const foundInGalleryImage = await (GalleryImage as any).find({ $or: orClauses }).lean().catch(() => []);
      for (const doc of (foundInGalleryImage || []) as any[]) {
        if (doc._id) docIdsToPurge.add(String(doc._id));
        if (doc.src) srcsToPurge.add(doc.src);
        if (doc.publicId) publicIdsToPurge.add(doc.publicId);
        const key = extractR2Key(doc.publicId) || extractR2Key(doc.src);
        if (key) r2KeysToDelete.add(key);
      }

      // 2. Find matching docs in Gallery
      const foundInGallery = await (Gallery as any).find({ $or: orClauses }).lean().catch(() => []);
      for (const doc of (foundInGallery || []) as any[]) {
        if (doc._id) docIdsToPurge.add(String(doc._id));
        if (doc.src) srcsToPurge.add(doc.src);
        if (doc.publicId) publicIdsToPurge.add(doc.publicId);
        const key = extractR2Key(doc.publicId) || extractR2Key(doc.src);
        if (key) r2KeysToDelete.add(key);
      }

      // 3. Search again in GalleryImage to catch duplicate documents by src/publicId
      const secondaryOr: any[] = [];
      if (srcsToPurge.size > 0) {
        secondaryOr.push({ src: { $in: Array.from(srcsToPurge) } });
      }
      if (publicIdsToPurge.size > 0) {
        secondaryOr.push({ publicId: { $in: Array.from(publicIdsToPurge) } });
      }
      if (secondaryOr.length > 0) {
        const secondaryFound = await (GalleryImage as any).find({ $or: secondaryOr }).lean().catch(() => []);
        for (const doc of (secondaryFound || []) as any[]) {
          if (doc._id) docIdsToPurge.add(String(doc._id));
        }
      }

      const objectIdsToDelete = Array.from(docIdsToPurge)
        .filter((d) => /^[0-9a-fA-F]{24}$/.test(d))
        .map((d) => parseObjectId(d));
      const stringIdsToDelete = Array.from(docIdsToPurge);

      const deleteFilter: any = {
        $or: [
          ...(objectIdsToDelete.length > 0 ? [{ _id: { $in: objectIdsToDelete } }] : []),
          { _id: { $in: stringIdsToDelete } },
          ...(srcsToPurge.size > 0 ? [{ src: { $in: Array.from(srcsToPurge) } }] : []),
          ...(publicIdsToPurge.size > 0 ? [{ publicId: { $in: Array.from(publicIdsToPurge) } }] : []),
        ],
      };

      // Delete from GalleryImage
      await (GalleryImage as any).deleteMany(deleteFilter).catch((err: any) => {
        console.warn('[galleryStorage] GalleryImage deleteMany error:', err);
      });

      // Delete from Gallery model
      await (Gallery as any).deleteMany(deleteFilter).catch((err: any) => {
        console.warn('[galleryStorage] Gallery deleteMany error:', err);
      });

      // Delete from raw collections
      const collectionsToCheck = ['galleryimages', 'gallery_images', 'galleries', 'gallery'];
      for (const colName of collectionsToCheck) {
        try {
          await db.connection.collection(colName).deleteMany(deleteFilter);
        } catch {}
      }

      // Delete from FileRecord
      const fileRecordFilters: any[] = [];
      if (srcsToPurge.size > 0) {
        fileRecordFilters.push({ url: { $in: Array.from(srcsToPurge) } });
      }
      if (publicIdsToPurge.size > 0) {
        fileRecordFilters.push({ publicId: { $in: Array.from(publicIdsToPurge) } });
      }
      if (fileRecordFilters.length > 0) {
        await FileRecord.deleteMany({ $or: fileRecordFilters }).catch(() => null);
      }
    }
  } catch (mongoErr) {
    console.warn('[galleryStorage] MongoDB delete error, continuing with storage cleanup:', mongoErr);
  }

  // 4. Delete from Cloudflare R2
  for (const key of r2KeysToDelete) {
    try {
      await deleteFromR2(key);
    } catch (r2Err) {
      console.warn(`[galleryStorage] R2 delete error for key ${key}:`, r2Err);
    }
  }

  // 5. Update local in-memory array & write cache file
  const current = getInMemoryGallery();
  const filtered = current.filter((item) => {
    if (docIdsToPurge.has(String(item._id))) return false;
    if (item.src && srcsToPurge.has(item.src)) return false;
    if (item.publicId && publicIdsToPurge.has(item.publicId)) return false;
    return true;
  });
  syncCache(filtered);

  // 6. Trigger full revalidation
  triggerRevalidation();

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
