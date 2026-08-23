import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { DEFAULT_FULL_SITE_CONFIG } from '@/lib/siteConfigDefaults';

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
  return {
    _id: String(doc._id),
    title: String(doc.title || ''),
    slug: String(doc.slug || ''),
    category: String(doc.category || ''),
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
    global.__inMemoryServices = defaultServices.map((s: any, idx: number) => ({
      _id: s._id || `srv-${idx}`,
      title: s.title || '',
      slug: s.slug || (s.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: s.category || (s.title || '').toLowerCase().replace(/photography$/i, '').trim(),
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
    }));
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
  const baseServiceData = {
    title: data.title || 'New Service',
    slug: data.slug || (data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `service-${Date.now()}`),
    category: data.category || '',
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

  try {
    const db = await connectToDatabase();
    if (db) {
      const created: any = await Service.create(baseServiceData);
      const fresh: any = await Service.findById(created._id).lean();
      if (fresh) return mapService(fresh);
    }
  } catch (err) {
    console.warn('MongoDB create warning:', err);
  }

  const memoryServices = getInMemoryServices();
  const fallbackItem: ServiceItemData = {
    ...baseServiceData,
    _id: data._id || `srv-${Date.now()}`,
  };
  memoryServices.push(fallbackItem);
  return fallbackItem;
}

export async function updateExistingService(id: string, data: Partial<ServiceItemData>): Promise<ServiceItemData> {
  assertNoProhibitedLanguage(data);
  const heroImg = data.heroImage || (typeof data.image === 'string' ? data.image : data.image?.url);

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
        ...(typeof data.category !== 'undefined' && { category: data.category }),
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
      if (updated) return mapService(updated);
    }
  } catch (err) {
    console.warn('MongoDB update fallback:', err);
  }

  const memoryServices = getInMemoryServices();
  const idx = memoryServices.findIndex((s) => s._id === id || s.slug === data.slug || s.slug === id);
  if (idx === -1) {
    throw new ApiError('Service not found', 404);
  }

  const existing = memoryServices[idx];
  const updatedItem: ServiceItemData = {
    ...existing,
    ...data,
    _id: existing._id,
    heroImage: heroImg || existing.heroImage,
    image: heroImg || existing.image,
  };
  memoryServices[idx] = updatedItem;
  return updatedItem;
}

export async function deleteExistingService(id: string): Promise<boolean> {
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
      if (deleted.deletedCount === 1) return true;
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
  return true;
}
