import { connectToDatabase } from '@/lib/mongodb';
import Service from '@/models/Service';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';

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

export async function createNewService(data: Partial<ServiceItemData>): Promise<ServiceItemData> {
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
