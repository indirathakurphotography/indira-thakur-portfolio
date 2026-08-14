import { connectToDatabase } from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

const FAQModel = FAQ as any;

export interface FAQItemData {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  serviceId?: string;  // null = global, else references service
  createdAt?: string;
  updatedAt?: string;
}


function mapFAQ(doc: any): FAQItemData {
  return {
    _id: String(doc._id),
    question: String(doc.question || ''),
    answer: String(doc.answer || ''),
    category: String(doc.category || 'General'),
    order: typeof doc.order === 'number' ? doc.order : 0,
    serviceId: doc.serviceId,
  };
}

export async function fetchAllFAQs(): Promise<FAQItemData[]> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to read FAQs.');
  }
  const mongoItems = await FAQModel.find({}).sort({ order: 1, createdAt: -1 }).lean();
  return (mongoItems || []).map(mapFAQ);
}

export async function createNewFAQ(data: Partial<FAQItemData>): Promise<FAQItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to persist FAQ.');
  }

  const newItemData = {
    question: data.question || 'New Question',
    answer: data.answer || '',
    category: data.category || 'General',
    order: typeof data.order === 'number' ? data.order : Date.now(),
    serviceId: data.serviceId,
  };

  const created: any = await FAQ.create(newItemData);

  // Read-after-write verification
  const fresh: any = await FAQModel.findById(created._id).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: created FAQ was not found in MongoDB.');
  }

  return mapFAQ(fresh);
}

export async function updateExistingFAQ(id: string, data: Partial<FAQItemData>): Promise<FAQItemData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to update FAQ.');
  }

  const objectId = parseObjectId(id);
  const dbUpdate: any = {
    ...(data.question && { question: data.question }),
    ...(data.answer && { answer: data.answer }),
    ...(data.category && { category: data.category }),
    ...(data.order !== undefined && { order: data.order }),
    ...(data.serviceId !== undefined && { serviceId: data.serviceId }),
  };

  const updated: any = await FAQModel.findByIdAndUpdate(objectId, dbUpdate, { new: true }).lean();
  if (!updated) {
    throw new ApiError('FAQ not found', 404);
  }

  // Read-after-write verification
  const fresh: any = await FAQModel.findById(objectId).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: updated FAQ was not found in MongoDB.');
  }

  return mapFAQ(fresh);
}

export async function deleteExistingFAQ(id: string): Promise<boolean> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to delete FAQ.');
  }

  const objectId = parseObjectId(id);
  const deleted = await FAQ.deleteOne({ _id: objectId });
  if (deleted.deletedCount !== 1) {
    throw new ApiError('FAQ not found', 404);
  }

  // Delete verification
  const check = await FAQModel.findById(objectId).lean();
  if (check) {
    throw new Error('Delete verification failed: FAQ still exists in MongoDB.');
  }

  return true;
}
