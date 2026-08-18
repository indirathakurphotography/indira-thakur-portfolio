import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

export interface ServiceItemData {
  _id: string;
  title: string;
  slug: string;
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

export async function fetchAllServices(): Promise<ServiceItemData[]> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to read services.');
  }
  const mongoServices = await Service.find({}).sort({ order: 1, createdAt: -1 }).lean();
  return (mongoServices || []).map(mapService);
}

export async function fetchServiceBySlug(slug: string): Promise<ServiceItemData | null> {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return null;
    }
    const cleanSlug = slug.toLowerCase().trim();
    const item = await Service.findOne({
      $or: [
        { slug: cleanSlug },
        { slug: `${cleanSlug}-photography` },
        { slug: cleanSlug.replace(/-photography$/, '') },
      ],
    }).lean();
    if (!item) return null;
    return mapService(item);
  } catch (err) {
    console.error('Error fetching service by slug:', err);
    return null;
  }
}

export async function createNewService(data: Partial<ServiceItemData>): Promise<ServiceItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to persist service.');
  }

  const heroImg = data.heroImage || (typeof data.image === 'string' ? data.image : data.image?.url) || '';
  const newServiceData = {
    title: data.title || 'New Service',
    slug: data.slug || `service-${Date.now()}`,
    tagline: data.tagline || '',
    description: data.description || '',
    heroImage: heroImg,
    image: heroImg,
    publicId: data.publicId || '',
    benefits: data.benefits || [],
    gallery: data.gallery || [],
    price: data.price || '',
    cta: data.cta || 'Book Now',
    featured: Boolean(data.featured),
    order: typeof data.order === 'number' ? data.order : Date.now(),
  };

  const created: any = await Service.create(newServiceData);

  // Read-after-write verification
  const fresh: any = await Service.findById(created._id).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: created service was not found in MongoDB.');
  }

  return mapService(fresh);
}

export async function updateExistingService(id: string, data: Partial<ServiceItemData>): Promise<ServiceItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to update service.');
  }

  const objectId = parseObjectId(id);
  const heroImg = data.heroImage || (typeof data.image === 'string' ? data.image : data.image?.url);

  const dbUpdate: any = {
    ...(data.title && { title: data.title }),
    ...(data.slug && { slug: data.slug }),
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

  const updated: any = await Service.findByIdAndUpdate(objectId, { $set: dbUpdate }, { new: true }).lean();
  if (!updated) {
    throw new ApiError('Service not found', 404);
  }

  // Read-after-write verification
  const fresh: any = await Service.findById(objectId).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: updated service was not found in MongoDB.');
  }

  return mapService(fresh);
}

export async function deleteExistingService(id: string): Promise<boolean> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to delete service.');
  }

  const objectId = parseObjectId(id);
  const deleted = await Service.deleteOne({ _id: objectId });
  if (deleted.deletedCount !== 1) {
    throw new ApiError('Service not found', 404);
  }

  // Delete verification
  const check = await Service.findById(objectId).lean();
  if (check) {
    throw new Error('Delete verification failed: service still exists in MongoDB.');
  }

  return true;
}
