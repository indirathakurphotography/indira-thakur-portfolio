import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { DEFAULT_FULL_SITE_CONFIG } from '@/lib/siteConfigDefaults';
import { normalizeCategory } from '@/lib/categoryUtils';
import {
  syncGalleryCategoryFromService,
  handleServiceDeletionCategorySync,
} from '@/lib/gallerySettingsStorage';

export interface ServiceItemData {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  eyebrow?: string;
  tagline?: string;
  description: string;
  heroImage?: string;
  image?: string | { url: string; alt?: string };
  publicId?: string;
  benefits?: string[];
  gallery?: string[];
  price?: string;
  cta?: string;
  featured?: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

function mapService(doc: any): ServiceItemData {
  const rawCat = doc.category || '';
  const cleanCat = rawCat.trim() || normalizeCategory(doc.title || doc.slug);
  return {
    _id: String(doc._id),
    title: String(doc.title || ''),
    slug: String(doc.slug || ''),
    category: cleanCat,
    eyebrow: String(doc.eyebrow || doc.tagline || ''),
    tagline: String(doc.tagline || ''),
    description: String(doc.description || ''),
    heroImage: doc.heroImage || (typeof doc.image === 'string' ? doc.image : doc.image?.url) || '',
    image: doc.heroImage || (typeof doc.image === 'string' ? doc.image : doc.image?.url) || '',
    publicId: String(doc.publicId || ''),
    benefits: Array.isArray(doc.benefits) ? doc.benefits : [],
    gallery: Array.isArray(doc.gallery) ? doc.gallery : [],
    price: String(doc.price || ''),
    cta: String(doc.cta || 'Book Now'),
    featured: Boolean(doc.featured),
    order: typeof doc.order === 'number' ? doc.order : 0,
  };
}

declare global {
  var __inMemoryServices: ServiceItemData[] | undefined;
}

function getInMemoryServices(): ServiceItemData[] {
  if (!global.__inMemoryServices) {
    const defaultServices = DEFAULT_FULL_SITE_CONFIG?.services?.services || [];
    global.__inMemoryServices = defaultServices.map((s: any, idx: number) => {
      const cleanCat = s.category || normalizeCategory(s.title || s.slug);
      return {
        _id: s._id || `srv-${idx}`,
        title: s.title || '',
        slug: s.slug || (s.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: cleanCat,
        eyebrow: s.eyebrow || s.subtitle || s.tagline || '',
        tagline: s.subtitle || s.tagline || '',
        description: s.description || '',
        heroImage: s.image?.url || (typeof s.image === 'string' ? s.image : '') || '',
        image: s.image?.url || (typeof s.image === 'string' ? s.image : '') || '',
        benefits: Array.isArray(s.benefits) ? s.benefits : [],
        price: s.price || '',
        cta: s.cta || 'Book Now',
        featured: Boolean(s.featured),
        order: typeof s.order === 'number' ? s.order : idx,
      };
    });
  }
  return global.__inMemoryServices;
}

export async function fetchAllServices(): Promise<ServiceItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const mongoServices = await Service.find({}).sort({ order: 1, createdAt: -1 }).lean();
      if (mongoServices && mongoServices.length > 0) {
        return mongoServices.map(mapService);
      }
    }
  } catch (err) {
    console.warn('Database read warning for services, using default fallback:', err);
  }

  return getInMemoryServices();
}

export async function fetchServiceBySlug(slug: string): Promise<ServiceItemData | null> {
  try {
    const cleanSlug = slug.toLowerCase().trim();
    const baseSlug = cleanSlug.replace(/-photography$/, '');
    const fullSlug = `${baseSlug}-photography`;

    const db = await connectToDatabase();
    if (db) {
      const item = await Service.findOne({
        $or: [
          { slug: cleanSlug },
          { slug: baseSlug },
          { slug: fullSlug },
          { title: new RegExp(`^${baseSlug.replace(/-/g, ' ')}`, 'i') },
        ],
      }).lean();
      if (item) return mapService(item);
    }

    const memoryServices = getInMemoryServices();
    const found = memoryServices.find((s: any) => {
      const sSlug = (s.slug || s.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        sSlug === cleanSlug ||
        sSlug === baseSlug ||
        sSlug === fullSlug ||
        (s.title || '').toLowerCase().includes(baseSlug.replace(/-/g, ' '))
      );
    });

    if (found) {
      return { ...found };
    }
    return null;
  } catch (err) {
    console.error('Error fetching service by slug:', err);
    return null;
  }
}

export async function createNewService(data: Partial<ServiceItemData>): Promise<ServiceItemData> {
  assertNoProhibitedLanguage(data);
  const heroImg = data.heroImage || (typeof data.image === 'string' ? data.image : data.image?.url) || '';
  const cleanCategory = data.category?.trim() || normalizeCategory(data.title || data.slug);

  const baseServiceData = {
    title: data.title || 'New Service',
    slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `service-${Date.now()}`),
    category: cleanCategory,
    eyebrow: data.eyebrow || '',
    tagline: data.tagline || '',
    description: data.description || '',
    heroImage: heroImg,
    image: heroImg,
    publicId: data.publicId || '',
    benefits: Array.isArray(data.benefits) ? data.benefits : [],
    gallery: Array.isArray(data.gallery) ? data.gallery : [],
    price: data.price || '',
    cta: data.cta || 'Book Now',
    featured: Boolean(data.featured),
    order: typeof data.order === 'number' ? data.order : 0,
  };

  let createdItem: ServiceItemData | null = null;

  try {
    const db = await connectToDatabase();
    if (db) {
      const created: any = await Service.create(baseServiceData);
      const fresh: any = await Service.findById(created._id).lean();
      if (fresh) {
        createdItem = mapService(fresh);
      }
    }
  } catch (err) {
    console.warn('MongoDB create warning:', err);
  }

  if (!createdItem) {
    const memoryServices = getInMemoryServices();
    createdItem = {
      ...baseServiceData,
      _id: data._id || `srv-${Date.now()}`,
    };
    memoryServices.push(createdItem);
  }

  // Auto-create and synchronize corresponding Gallery Category in GallerySettings
  await syncGalleryCategoryFromService(createdItem);

  return createdItem;
}

export async function updateExistingService(id: string, data: Partial<ServiceItemData>): Promise<ServiceItemData> {
  assertNoProhibitedLanguage(data);
  const heroImg = data.heroImage || (typeof data.image === 'string' ? data.image : data.image?.url);

  let existingItem: ServiceItemData | null = null;
  const allCurrent = await fetchAllServices();
  existingItem = allCurrent.find((s) => s._id === id || s.slug === id) || null;
  const oldCategoryKey = existingItem?.category || (existingItem?.title ? normalizeCategory(existingItem.title) : undefined);

  const cleanCategory = typeof data.category !== 'undefined'
    ? data.category.trim() || normalizeCategory(data.title || existingItem?.title || '')
    : undefined;

  let updatedResult: ServiceItemData | null = null;

  try {
    const db = await connectToDatabase();
    if (db) {
      let filter: any = null;
      try {
        const objectId = parseObjectId(id);
        filter = { $or: [{ _id: objectId }, { slug: id }] };
      } catch {
        filter = { slug: id };
      }

      const dbUpdate: any = {
        ...(data.title && { title: data.title }),
        ...(data.slug && { slug: data.slug }),
        ...(typeof cleanCategory !== 'undefined' && { category: cleanCategory }),
        ...(typeof data.eyebrow !== 'undefined' && { eyebrow: data.eyebrow }),
        ...(typeof data.tagline !== 'undefined' && { tagline: data.tagline }),
        ...(typeof data.description !== 'undefined' && { description: data.description }),
        ...(heroImg && { heroImage: heroImg, image: heroImg }),
        ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
        ...(data.benefits && { benefits: data.benefits }),
        ...(data.gallery && { gallery: data.gallery }),
        ...(typeof data.price !== 'undefined' && { price: data.price }),
        ...(typeof data.cta !== 'undefined' && { cta: data.cta }),
        ...(typeof data.featured === 'boolean' && { featured: data.featured }),
        ...(typeof data.order === 'number' && { order: data.order }),
      };

      const updated: any = await Service.findOneAndUpdate(filter, { $set: dbUpdate }, { new: true }).lean();
      if (updated) {
        updatedResult = mapService(updated);
      }
    }
  } catch (err) {
    console.warn('MongoDB update fallback:', err);
  }

  if (!updatedResult) {
    const memoryServices = getInMemoryServices();
    const idx = memoryServices.findIndex((s) => s._id === id || s.slug === data.slug || s.slug === id);
    if (idx === -1) {
      throw new ApiError('Service not found', 404);
    }

    const existing = memoryServices[idx];
    updatedResult = {
      ...existing,
      ...data,
      category: typeof cleanCategory !== 'undefined' ? cleanCategory : existing.category,
      _id: existing._id,
      heroImage: heroImg || existing.heroImage,
      image: heroImg || existing.image,
    };
    memoryServices[idx] = updatedResult;
  }

  // Synchronize Gallery Category in GallerySettings
  await syncGalleryCategoryFromService(updatedResult, oldCategoryKey);

  return updatedResult;
}

export async function deleteExistingService(id: string): Promise<boolean> {
  const allCurrent = await fetchAllServices();
  const target = allCurrent.find((s) => s._id === id || s.slug === id);
  const targetCategory = target?.category || (target?.title ? normalizeCategory(target.title) : '');

  try {
    const db = await connectToDatabase();
    if (db) {
      let filter: any = null;
      try {
        const objectId = parseObjectId(id);
        filter = { $or: [{ _id: objectId }, { slug: id }] };
      } catch {
        filter = { slug: id };
      }
      const deleted = await Service.deleteOne(filter);
      if (deleted.deletedCount === 1) {
        const remaining = allCurrent.filter((s) => s._id !== id && s.slug !== id);
        if (targetCategory) {
          await handleServiceDeletionCategorySync(targetCategory, remaining);
        }
        return true;
      }
    }
  } catch (err) {
    console.warn('MongoDB delete fallback:', err);
  }

  const memoryServices = getInMemoryServices();
  const idx = memoryServices.findIndex((s) => s._id === id || s.slug === id);
  if (idx === -1) {
    throw new ApiError('Service not found', 404);
  }
  memoryServices.splice(idx, 1);
  if (targetCategory) {
    await handleServiceDeletionCategorySync(targetCategory, memoryServices);
  }
  return true;
}
