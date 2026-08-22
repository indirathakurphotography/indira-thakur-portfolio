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
  try {
    const db = await connectToDatabase();
    if (!db || !db.connection?.db) {
      return [];
    }
    const items = await db.connection.db.collection('testimonials').find({}).sort({ order: 1, createdAt: -1 }).toArray();
    return items.map(mapTestimonial);
  } catch (err) {
    console.warn('MongoDB fetch testimonials fallback:', err);
    return [];
  }
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

  const result = await db.collection('testimonials').insertOne(newItemData);
  if (!result?.insertedId) {
    throw new Error('MongoDB insert failed. Testimonial was not persisted.');
  }

  // Read-after-write verification
  const fresh = await db.collection('testimonials').findOne({ _id: result.insertedId });
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

  const result = await db.collection('testimonials').updateOne({ _id: objectId }, { $set: dbUpdate });
  if (result.matchedCount !== 1) {
    throw new ApiError('Testimonial not found', 404);
  }

  // Read-after-write verification
  const fresh = await db.collection('testimonials').findOne({ _id: objectId });
  if (!fresh) {
    throw new Error('Read-after-write verification failed: updated testimonial was not found in MongoDB.');
  }

  return mapTestimonial(fresh);
}

export async function deleteExistingTestimonial(id: string): Promise<boolean> {
  const db = await getDb();
  const objectId = parseObjectId(id);

  const result = await db.collection('testimonials').deleteOne({ _id: objectId });
  if (result.deletedCount !== 1) {
    throw new ApiError('Testimonial not found', 404);
  }

  // Delete verification
  const check = await db.collection('testimonials').findOne({ _id: objectId });
  if (check) {
    throw new Error('Delete verification failed: testimonial still exists in MongoDB.');
  }

  return true;
}
