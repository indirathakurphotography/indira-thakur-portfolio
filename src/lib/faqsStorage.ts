import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';

const FAQModel = FAQ as any;

const FALLBACK_FAQS_PATH = path.join(process.cwd(), '.faqs-cache.json');

declare global {
  var __faqsFallback: FAQItemData[] | undefined;
}

function readLocalFallbackFAQs(): FAQItemData[] {
  if (global.__faqsFallback) {
    return global.__faqsFallback;
  }
  try {
    if (fs.existsSync(FALLBACK_FAQS_PATH)) {
      const data = fs.readFileSync(FALLBACK_FAQS_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        global.__faqsFallback = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

function writeLocalFallbackFAQs(items: FAQItemData[]): FAQItemData[] {
  global.__faqsFallback = items;
  try {
    fs.writeFileSync(FALLBACK_FAQS_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch {}
  return items;
}

export interface FAQItemData {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  scope?: string;
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
    scope: String(doc.scope || 'home'),
    order: typeof doc.order === 'number' ? doc.order : 0,
    serviceId: doc.serviceId,
  };
}

export async function fetchAllFAQs(): Promise<FAQItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const mongoItems = await FAQModel.find({}).sort({ order: 1, createdAt: -1 }).lean();
      if (mongoItems && mongoItems.length > 0) {
        return mongoItems.map(mapFAQ);
      }
    }
  } catch (err) {
    console.warn('MongoDB fetch FAQs fallback:', err);
  }
  return readLocalFallbackFAQs();
}

export async function createNewFAQ(data: Partial<FAQItemData>): Promise<FAQItemData> {
  assertNoProhibitedLanguage(data);
  const newItemData = {
    question: data.question || 'New Question',
    answer: data.answer || '',
    category: data.category || 'General',
    scope: data.scope || 'home',
    order: typeof data.order === 'number' ? data.order : Date.now(),
    serviceId: data.serviceId,
  };

  try {
    const db = await connectToDatabase();
    if (db) {
      const created: any = await FAQ.create(newItemData);
      const fresh: any = await FAQModel.findById(created._id).lean();
      if (fresh) return mapFAQ(fresh);
    }
  } catch (err) {
    console.warn('MongoDB create FAQ fallback:', err);
  }

  const memoryFaqs = readLocalFallbackFAQs();
  const fallbackItem: FAQItemData = {
    ...newItemData,
    _id: data._id || `faq-${Date.now()}`,
  };
  memoryFaqs.push(fallbackItem);
  writeLocalFallbackFAQs(memoryFaqs);
  return fallbackItem;
}

export async function updateExistingFAQ(id: string, data: Partial<FAQItemData>): Promise<FAQItemData> {
  assertNoProhibitedLanguage(data);

  try {
    const db = await connectToDatabase();
    if (db) {
      const objectId = parseObjectId(id);
      const dbUpdate: any = {
        ...(data.question && { question: data.question }),
        ...(data.answer && { answer: data.answer }),
        ...(data.category && { category: data.category }),
        ...(data.scope !== undefined && { scope: data.scope }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.serviceId !== undefined && { serviceId: data.serviceId }),
      };

      const updated: any = await FAQModel.findByIdAndUpdate(objectId, dbUpdate, { new: true }).lean();
      if (updated) return mapFAQ(updated);
    }
  } catch (err) {
    console.warn('MongoDB update FAQ fallback:', err);
  }

  const memoryFaqs = readLocalFallbackFAQs();
  const idx = memoryFaqs.findIndex(f => f._id === id);
  if (idx === -1) {
    throw new ApiError('FAQ not found', 404);
  }
  const updatedItem: FAQItemData = {
    ...memoryFaqs[idx],
    ...(data.question && { question: data.question }),
    ...(data.answer && { answer: data.answer }),
    ...(data.category && { category: data.category }),
    ...(data.scope !== undefined && { scope: data.scope }),
    ...(data.order !== undefined && { order: data.order }),
  };
  memoryFaqs[idx] = updatedItem;
  writeLocalFallbackFAQs(memoryFaqs);
  return updatedItem;
}

export async function deleteExistingFAQ(id: string): Promise<boolean> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const objectId = parseObjectId(id);
      const deleted = await FAQ.deleteOne({ _id: objectId });
      if (deleted.deletedCount === 1) return true;
    }
  } catch (err) {
    console.warn('MongoDB delete FAQ fallback:', err);
  }

  const memoryFaqs = readLocalFallbackFAQs();
  const filtered = memoryFaqs.filter(f => f._id !== id);
  if (filtered.length === memoryFaqs.length) {
    throw new ApiError('FAQ not found', 404);
  }
  writeLocalFallbackFAQs(filtered);
  return true;
}
