import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';

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

export const DEFAULT_APPROVED_SERVICES: ServiceItemData[] = [
  {
    _id: 'srv-newborn',
    title: 'Newborn Photography',
    slug: 'newborn-photography',
    tagline: 'Gentle & Safe First Slumbers',
    description: 'Safety-certified, peaceful infant art focusing on delicate details, organic textures, and pure family connection in a climate-controlled studio.',
    heroImage: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
    order: 1,
    featured: true,
    price: 'Starting at ₹25,000',
    cta: 'Book Newborn Session'
  },
  {
    _id: 'srv-maternity',
    title: 'Maternity Photography',
    slug: 'maternity-photography',
    tagline: 'Graceful & Timeless Pregnancy Art',
    description: 'Celebrate the extraordinary beauty of motherhood with couture studio gowns, artistic drapery, and romantic golden-hour lighting designed to highlight your strength and glow.',
    heroImage: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
    order: 2,
    featured: true,
    price: 'Starting at ₹30,000',
    cta: 'Book Maternity Session'
  },
  {
    _id: 'srv-portraits',
    title: 'Portraits',
    slug: 'portraits',
    tagline: 'Timeless Heirloom Portraiture',
    description: 'Masterfully lit studio and outdoor portraiture capturing multi-generational grace, quiet intimacy, and authentic personal expression.',
    heroImage: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573522517-IMG_4416_copy_b_w.jpg',
    order: 3,
    featured: true,
    price: 'Starting at ₹20,000',
    cta: 'Book Portrait Session'
  },
  {
    _id: 'srv-wedding',
    title: 'Wedding Photography',
    slug: 'wedding-photography',
    tagline: 'Editorial Wedding Stories',
    description: 'Cinematic, documentary-style wedding coverage capturing sacred rituals, raw emotions, and grand celebrations with artistic flair.',
    heroImage: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
    order: 4,
    featured: true,
    price: 'Starting at ₹75,000',
    cta: 'Inquire Wedding Coverage'
  },
  {
    _id: 'srv-events',
    title: 'Events',
    slug: 'events',
    tagline: 'Milestone & Celebration Documentaries',
    description: 'Seamless event photography for family milestones, naming ceremonies, anniversaries, and high-profile gatherings.',
    heroImage: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524109798-event-naming_ceremony.jpg',
    order: 5,
    featured: false,
    price: 'Starting at ₹35,000',
    cta: 'Book Event Coverage'
  },
  {
    _id: 'srv-brand',
    title: 'Brand Collaboration',
    slug: 'brand-collaboration',
    tagline: 'Couture Brand & Editorial Storycraft',
    description: 'High-end editorial imagery, brand campaigns, and bespoke event documentaries crafted with journalistic precision and artistic flair.',
    heroImage: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
    order: 6,
    featured: false,
    price: 'Custom Quote',
    cta: 'Collaborate With Us'
  }
];

const FALLBACK_FILE_PATH = path.join('/tmp', 'services_fallback_store.json');
let memoryStore: ServiceItemData[] | null = null;

function loadFallbackStore(): ServiceItemData[] {
  if (memoryStore !== null) return memoryStore;
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
    console.warn('[servicesStorage] Error reading fallback store:', err);
  }
  memoryStore = [...DEFAULT_APPROVED_SERVICES];
  saveFallbackStore(memoryStore);
  return memoryStore;
}

function saveFallbackStore(data: ServiceItemData[]) {
  memoryStore = data;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[servicesStorage] Error writing fallback store:', err);
  }
}

export async function fetchAllServices(): Promise<ServiceItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const mongoServices = await (Service as any).find({}).sort({ order: 1, createdAt: -1 }).lean();
      if (mongoServices && mongoServices.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (mongoServices || []).map((s: any) => ({
          _id: String(s._id),
          title: String(s.title || ''),
          slug: String(s.slug || ''),
          tagline: String(s.tagline || ''),
          description: String(s.description || ''),
          heroImage: s.heroImage || (typeof s.image === 'string' ? s.image : s.image?.url) || '',
          image: s.heroImage || (typeof s.image === 'string' ? s.image : s.image?.url) || '',
          publicId: String(s.publicId || ''),
          benefits: Array.isArray(s.benefits) ? s.benefits : [],
          gallery: Array.isArray(s.gallery) ? s.gallery : [],
          price: String(s.price || ''),
          cta: String(s.cta || 'Book Now'),
          featured: Boolean(s.featured),
          order: typeof s.order === 'number' ? s.order : 0,
        }));
        saveFallbackStore(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[servicesStorage] MongoDB fetch failed, using fallback:', err);
  }

  return loadFallbackStore();
}

export async function createNewService(data: Partial<ServiceItemData>): Promise<ServiceItemData> {
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

  try {
    const db = await connectToDatabase();
    if (db) {
      const created: any = await (Service as any).create(newServiceData);
      const createdItem: ServiceItemData = {
        _id: String(created._id),
        title: created.title,
        slug: created.slug,
        tagline: created.tagline,
        description: created.description,
        heroImage: created.heroImage,
        image: created.image,
        publicId: created.publicId,
        benefits: created.benefits,
        gallery: created.gallery,
        price: created.price,
        cta: created.cta,
        featured: created.featured,
        order: created.order,
      };
      const list = loadFallbackStore();
      list.push(createdItem);
      saveFallbackStore(list);
      return createdItem;
    }
  } catch (err) {
    console.warn('[servicesStorage] MongoDB create failed, saved to fallback:', err);
  }

  const list = loadFallbackStore();
  const fallbackService: ServiceItemData = {
    _id: `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...newServiceData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.push(fallbackService);
  saveFallbackStore(list);
  return fallbackService;
}

export async function updateExistingService(id: string, data: Partial<ServiceItemData>): Promise<ServiceItemData | null> {
  const heroImg = data.heroImage || (typeof data.image === 'string' ? data.image : data.image?.url);

  try {
    const db = await connectToDatabase();
    if (db) {
      const dbUpdate = {
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

      const collection = db.connection.collection('services');
      let updated: any = null;

      try {
        const res = await collection.findOneAndUpdate(
          { $or: [{ _id: id as any }, { id: id as any }, { slug: id }] },
          { $set: { ...dbUpdate, updatedAt: new Date() } },
          { returnDocument: 'after' }
        );
        if (res) {
          updated = res;
        }
      } catch (colErr) {
        console.warn('[servicesStorage] Native findOneAndUpdate warning:', colErr);
      }

      if (!updated) {
        updated = await (Service as any).findOneAndUpdate(
          { $or: [{ _id: id }, { slug: id }, { title: data.title }] },
          { $set: dbUpdate },
          { new: true }
        );
      }

      if (updated) {
        const item: ServiceItemData = {
          _id: String(updated._id),
          title: String(updated.title || ''),
          slug: String(updated.slug || ''),
          tagline: String(updated.tagline || ''),
          description: String(updated.description || ''),
          heroImage: updated.heroImage || (typeof updated.image === 'string' ? updated.image : updated.image?.url) || '',
          image: updated.heroImage || (typeof updated.image === 'string' ? updated.image : updated.image?.url) || '',
          publicId: String(updated.publicId || ''),
          benefits: Array.isArray(updated.benefits) ? updated.benefits : [],
          gallery: Array.isArray(updated.gallery) ? updated.gallery : [],
          price: String(updated.price || ''),
          cta: String(updated.cta || 'Book Now'),
          featured: Boolean(updated.featured),
          order: typeof updated.order === 'number' ? updated.order : 0,
        };
        const list = loadFallbackStore();
        const idx = list.findIndex(s => s._id === id || s.slug === id);
        if (idx !== -1) {
          list[idx] = item;
          saveFallbackStore(list);
        } else {
          list.push(item);
          saveFallbackStore(list);
        }
        return item;
      }
    }
  } catch (err) {
    console.warn('[servicesStorage] MongoDB update failed, updated in fallback:', err);
  }

  const list = loadFallbackStore();
  const idx = list.findIndex(s => s._id === id || s.slug === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
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
      updatedAt: new Date().toISOString(),
    };
    saveFallbackStore(list);
    return list[idx];
  }

  return null;
}

export async function deleteExistingService(id: string): Promise<boolean> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const deleted = await (Service as any).findByIdAndDelete(id);
      const list = loadFallbackStore();
      const filtered = list.filter(s => s._id !== id && s.slug !== id);
      saveFallbackStore(filtered);
      return Boolean(deleted);
    }
  } catch (err) {
    console.warn('[servicesStorage] MongoDB delete failed, deleted from fallback:', err);
  }

  const list = loadFallbackStore();
  const filtered = list.filter(s => s._id !== id && s.slug !== id);
  saveFallbackStore(filtered);
  return true;
}
