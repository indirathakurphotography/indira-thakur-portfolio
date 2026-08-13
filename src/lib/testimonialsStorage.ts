import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import Testimonial from '@/models/Testimonial';

export interface TestimonialItemData {
  _id: string;
  name: string;
  role?: string;
  content: string;
  rating?: number;
  featured?: boolean;
  order?: number;
  image?: string;
  publicId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_TESTIMONIALS: TestimonialItemData[] = [
  {
    _id: 't-1',
    name: 'Aanya & Vikram Mehta',
    role: 'Maternity & Newborn Session',
    content: 'Indira has an extraordinary gift. She made us feel so comfortable during our maternity shoot and handled our 8-day-old baby with such gentle warmth. The photographs belong in an art museum!',
    rating: 5,
    featured: true,
    order: 1,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/videos/thumbnails/1785434846593-thumb-1785434844774.jpg',
  },
  {
    _id: 't-2',
    name: 'Priya & Rohan Sharma',
    role: 'Newborn Storytelling',
    content: 'The patience and care Indira showed during our newborn session was remarkable. The heirloom album we received is our family’s most cherished treasure.',
    rating: 5,
    featured: true,
    order: 2,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523812657-newborn_family_shoot.jpg',
  },
  {
    _id: 't-3',
    name: 'Kavita Iyer',
    role: 'Fine Art Portraiture',
    content: 'Working with Indira was an empowering experience. Her use of lighting and artistic composition created portraits that feel deeply personal yet timeless.',
    rating: 5,
    featured: true,
    order: 3,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/about/story/1785827668424-Indira.jpg',
  },
  {
    _id: 't-4',
    name: 'Ananya & Devraj Kapoor',
    role: 'Maternity Session',
    content: 'Our maternity portraits are breathtaking. Indira guided us with patience and warmth, making us feel completely comfortable in front of the lens.',
    rating: 5,
    featured: true,
    order: 4,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/services/maternity-photography/1785609879047-Maternity_shoot_in_nature.jpg',
  },
  {
    _id: 't-5',
    name: 'Nikhil & Sunita Deshmukh',
    role: 'Heritage Family Storytelling',
    content: 'The fine-art quality of the prints and album exceeded all expectations. She captured our family bond in the most graceful way possible.',
    rating: 5,
    featured: true,
    order: 5,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523719706-wedding_portraits.jpg',
  },
  {
    _id: 't-6',
    name: 'Rhea & Siddharth Singhania',
    role: 'Royal Wedding Portraiture',
    content: 'Indira captured every unscripted moment of our wedding weekend with cinematic perfection. Her attention to detail and editorial style are unmatched in Mumbai.',
    rating: 5,
    featured: true,
    order: 6,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785523973577-wedding_portraits_1_.jpg',
  },
  {
    _id: 't-7',
    name: 'Meera & Arjun Nair',
    role: 'Baby First Year Milestone',
    content: 'From our maternity shoot to our baby’s first birthday milestone, Indira has documented our journey with pure artistic brilliance and immense patience.',
    rating: 5,
    featured: true,
    order: 7,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524139394-newborn_family_shoot.jpg',
  },
  {
    _id: 't-8',
    name: 'Dr. Shweta & Sameer Kulkarni',
    role: 'Intimate Maternity & Family Session',
    content: 'The calm, soothing atmosphere Indira creates in her studio allowed us to relax completely. The resultant portraits are absolute masterpieces.',
    rating: 5,
    featured: true,
    order: 8,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785524162837-maternity.jpg',
  },
  {
    _id: 't-9',
    name: 'Natasha & Aditya Roy',
    role: 'Editorial Brand & Personal Portrait',
    content: 'Indira’s background in journalism shines through in her storytelling. Her portraiture captures authentic soul and refined elegance.',
    rating: 5,
    featured: true,
    order: 9,
    image: 'https://hjsunwksrxtlielmefdu.supabase.co/storage/v1/object/public/images/home/hero/slideshow/1785573149313-47.jpg',
  },
];

const FALLBACK_FILE_PATH = path.join('/tmp', 'testimonials_fallback_store.json');
let memoryStore: TestimonialItemData[] | null = null;

function loadFallbackStore(): TestimonialItemData[] {
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
    console.warn('[testimonialsStorage] Error reading fallback store:', err);
  }
  memoryStore = [...DEFAULT_TESTIMONIALS];
  saveFallbackStore(memoryStore);
  return memoryStore;
}

function saveFallbackStore(data: TestimonialItemData[]) {
  memoryStore = data;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[testimonialsStorage] Error writing fallback store:', err);
  }
}

export async function fetchAllTestimonials(): Promise<TestimonialItemData[]> {
  try {
    const conn = await connectToDatabase();
    const db = conn?.connection?.db;
    if (db) {
      // Try reviews collection first
      const mongoItems = await db.collection('reviews').find({}).sort({ order: 1, createdAt: -1 }).toArray();
      if (mongoItems && mongoItems.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = mongoItems.map((t: any) => ({
          _id: String(t._id),
          name: String(t.name || ''),
          role: String(t.role || t.source || ''),
          content: String(t.content || ''),
          rating: typeof t.rating === 'number' ? t.rating : 5,
          featured: Boolean(t.featured),
          order: typeof t.order === 'number' ? t.order : 0,
          image: String(t.image || ''),
          publicId: String(t.publicId || ''),
        }));
        saveFallbackStore(mapped);
        return mapped;
      }
      // Try testimonials collection if reviews was empty
      const altItems = await db.collection('testimonials').find({}).sort({ order: 1, createdAt: -1 }).toArray();
      if (altItems && altItems.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = altItems.map((t: any) => ({

          _id: String(t._id),
          name: String(t.name || ''),
          role: String(t.role || ''),
          content: String(t.content || ''),
          rating: typeof t.rating === 'number' ? t.rating : 5,
          featured: Boolean(t.featured),
          order: typeof t.order === 'number' ? t.order : 0,
          image: String(t.image || ''),
          publicId: String(t.publicId || ''),
        }));
        saveFallbackStore(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[testimonialsStorage] MongoDB fetch failed, using fallback store:', err);
  }

  return loadFallbackStore();
}

export async function createNewTestimonial(data: Partial<TestimonialItemData>): Promise<TestimonialItemData> {
  const newItemData = {
    name: data.name || 'Anonymous Client',
    role: data.role || 'Client Experience',
    content: data.content || '',
    rating: typeof data.rating === 'number' ? data.rating : 5,
    featured: Boolean(data.featured),
    order: typeof data.order === 'number' ? data.order : Date.now(),
    image: data.image || '',
    publicId: data.publicId || '',
  };

  const list = loadFallbackStore();
  const fallbackItem: TestimonialItemData = {
    _id: `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...newItemData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.push(fallbackItem);
  saveFallbackStore(list);

  try {
    const conn = await connectToDatabase();
    const db = conn?.connection?.db;
    if (db) {
      const result = await db.collection('reviews').insertOne(newItemData);
      if (result && result.insertedId) {
        fallbackItem._id = String(result.insertedId);

        saveFallbackStore(list);
      }
    }
  } catch (err) {
    console.warn('[testimonialsStorage] MongoDB create failed, saved to fallback:', err);
  }

  return fallbackItem;
}

export async function updateExistingTestimonial(id: string, data: Partial<TestimonialItemData>): Promise<TestimonialItemData | null> {
  const list = loadFallbackStore();
  const idx = list.findIndex(t => t._id === id);
  let updatedItem: TestimonialItemData | null = null;

  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...(data.name && { name: data.name }),
      ...(typeof data.role !== 'undefined' && { role: data.role }),
      ...(data.content && { content: data.content }),
      ...(typeof data.rating === 'number' && { rating: data.rating }),
      ...(typeof data.featured === 'boolean' && { featured: data.featured }),
      ...(typeof data.order === 'number' && { order: data.order }),
      ...(typeof data.image !== 'undefined' && { image: data.image }),
      ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
      updatedAt: new Date().toISOString(),
    };
    updatedItem = list[idx];
    saveFallbackStore(list);
  }

  try {
    const conn = await connectToDatabase();
    const db = conn?.connection?.db;

    if (db) {
      const dbUpdate = {
        ...(data.name && { name: data.name }),
        ...(typeof data.role !== 'undefined' && { role: data.role }),
        ...(data.content && { content: data.content }),
        ...(typeof data.rating === 'number' && { rating: data.rating }),
        ...(typeof data.featured === 'boolean' && { featured: data.featured }),
        ...(typeof data.order === 'number' && { order: data.order }),
        ...(typeof data.image !== 'undefined' && { image: data.image }),
        ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
      };
      const { ObjectId } = await import('mongodb');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = { _id: id };
      try { query = { _id: new ObjectId(id) }; } catch { query = { _id: id }; }
      await db.collection('reviews').updateOne(query, { $set: dbUpdate });

    }
  } catch (err) {
    console.warn('[testimonialsStorage] MongoDB update failed, updated in fallback:', err);
  }

  return updatedItem;
}

export async function deleteExistingTestimonial(id: string): Promise<boolean> {
  const list = loadFallbackStore();
  const filtered = list.filter(t => t._id !== id);
  saveFallbackStore(filtered);

  try {
    const conn = await connectToDatabase();
    const db = conn?.connection?.db;
    if (db) {
      const { ObjectId } = await import('mongodb');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = { _id: id };
      try { query = { _id: new ObjectId(id) }; } catch { query = { _id: id }; }
      await db.collection('reviews').deleteOne(query);

    }
  } catch (err) {
    console.warn('[testimonialsStorage] MongoDB delete failed, deleted from fallback:', err);
  }

  return true;
}
