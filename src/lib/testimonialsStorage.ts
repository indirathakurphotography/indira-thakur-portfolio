import { connectToDatabase } from '@/lib/mongodb';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

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

function mapTestimonial(doc: any): TestimonialItemData {
  return {
    _id: String(doc._id),
    name: String(doc.name || ''),
    role: String(doc.role || doc.source || ''),
    content: String(doc.content || ''),
    rating: typeof doc.rating === 'number' ? doc.rating : 5,
    featured: Boolean(doc.featured),
    order: typeof doc.order === 'number' ? doc.order : 0,
    image: String(doc.image || ''),
    publicId: String(doc.publicId || ''),
  };
}

async function getDb() {
  const db = await connectToDatabase();
  if (!db || !db.connection?.db) {
    throw new Error('Database connection unavailable. Unable to read testimonials.');
  }
  return db.connection.db;
}

export async function fetchAllTestimonials(): Promise<TestimonialItemData[]> {
  const db = await getDb();

  const reviews = await db.collection('reviews').find({}).sort({ order: 1, createdAt: -1 }).toArray();
  if (reviews && reviews.length > 0) {
    return reviews.map(mapTestimonial);
  }

  const altItems = await db.collection('testimonials').find({}).sort({ order: 1, createdAt: -1 }).toArray();
  return (altItems || []).map(mapTestimonial);
}

export async function createNewTestimonial(data: Partial<TestimonialItemData>): Promise<TestimonialItemData> {
  assertNoProhibitedLanguage(data);
  const db = await getDb();

  const newItemData = {
    name: data.name || 'Anonymous Client',
    role: data.role || 'Client Experience',
    content: data.content || '',
    rating: typeof data.rating === 'number' ? data.rating : 5,
    featured: Boolean(data.featured),
    order: typeof data.order === 'number' ? data.order : Date.now(),
    image: data.image || '',
    publicId: data.publicId || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('reviews').insertOne(newItemData);
  if (!result?.insertedId) {
    throw new Error('MongoDB insert failed. Testimonial was not persisted.');
  }

  // Read-after-write verification
  const fresh = await db.collection('reviews').findOne({ _id: result.insertedId });
  if (!fresh) {
    throw new Error('Read-after-write verification failed: created testimonial was not found in MongoDB.');
  }

  return mapTestimonial(fresh);
}

export async function updateExistingTestimonial(id: string, data: Partial<TestimonialItemData>): Promise<TestimonialItemData> {
  assertNoProhibitedLanguage(data);
  const db = await getDb();
  const objectId = parseObjectId(id);

  const dbUpdate: any = {
    ...(data.name && { name: data.name }),
    ...(typeof data.role !== 'undefined' && { role: data.role }),
    ...(data.content && { content: data.content }),
    ...(typeof data.rating === 'number' && { rating: data.rating }),
    ...(typeof data.featured === 'boolean' && { featured: data.featured }),
    ...(typeof data.order === 'number' && { order: data.order }),
    ...(typeof data.image !== 'undefined' && { image: data.image }),
    ...(typeof data.publicId !== 'undefined' && { publicId: data.publicId }),
    updatedAt: new Date(),
  };

  const result = await db.collection('reviews').updateOne({ _id: objectId }, { $set: dbUpdate });
  if (result.matchedCount !== 1) {
    throw new ApiError('Testimonial not found', 404);
  }

  // Read-after-write verification
  const fresh = await db.collection('reviews').findOne({ _id: objectId });
  if (!fresh) {
    throw new Error('Read-after-write verification failed: updated testimonial was not found in MongoDB.');
  }

  return mapTestimonial(fresh);
}

export async function deleteExistingTestimonial(id: string): Promise<boolean> {
  const db = await getDb();
  const objectId = parseObjectId(id);

  const result = await db.collection('reviews').deleteOne({ _id: objectId });
  if (result.deletedCount !== 1) {
    throw new ApiError('Testimonial not found', 404);
  }

  // Delete verification
  const check = await db.collection('reviews').findOne({ _id: objectId });
  if (check) {
    throw new Error('Delete verification failed: testimonial still exists in MongoDB.');
  }

  return true;
}
