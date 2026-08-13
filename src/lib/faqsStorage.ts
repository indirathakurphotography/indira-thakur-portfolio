import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import FAQ from '@/models/FAQ';

export interface FAQItemData {
  _id: string;
  question: string;
  answer: string;
  category?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FAQS: FAQItemData[] = [
  {
    _id: 'faq-1',
    question: 'When should we book you for birth photography?',
    answer: 'Please book us in your second trimester as it helps us to plan things ahead of time.',
    category: 'Booking',
    order: 1,
  },
  {
    _id: 'faq-2',
    question: 'When is the best time for newborn shoot?',
    answer: "The best time to do a newborn shoot is within the first 15 days of the baby's birth.",
    category: 'Newborn',
    order: 2,
  },
  {
    _id: 'faq-3',
    question: 'What is the best time for maternity shoot?',
    answer: 'The best time for maternity shoot is between 24 and 28 weeks.',
    category: 'Maternity',
    order: 3,
  },
  {
    _id: 'faq-4',
    question: "Do you provide outfits for maternity shoot?",
    answer: "No, we don't provide outfits for maternity shoot. However, we can connect you to a reliable vendor.",
    category: 'Maternity',
    order: 4,
  },
  {
    _id: 'faq-5',
    question: 'Can you arrange for a MUA and hair stylist for the shoot?',
    answer: 'Yes, we can provide a MUA and a hair stylist.',
    category: 'Services',
    order: 5,
  },
  {
    _id: 'faq-6',
    question: 'When can we expect the photos to be delivered?',
    answer: 'The final photos are shared within 2 weeks after the shoot.',
    category: 'Delivery',
    order: 6,
  },
  {
    _id: 'faq-7',
    question: 'Do you have the option of photo prints or albums?',
    answer: 'Yes.',
    category: 'Products',
    order: 7,
  },
  {
    _id: 'faq-8',
    question: 'What are your charges?',
    answer: "As we provide a range of photography and videography services, the charges vary. Please fill up the contact form so we can provide you a quote that's tailored to your needs.",
    category: 'Pricing',
    order: 8,
  },
  {
    _id: 'faq-9',
    question: 'Do you provide raw pictures?',
    answer: "We don't provide raw pictures.",
    category: 'Policies',
    order: 9,
  },
  {
    _id: 'faq-10',
    question: 'Do you travel for shoots?',
    answer: 'Yes, we do travel for shoots.',
    category: 'Travel',
    order: 10,
  },
];

const FALLBACK_FILE_PATH = path.join('/tmp', 'faqs_fallback_store.json');
let memoryStore: FAQItemData[] | null = null;

function loadFallbackStore(): FAQItemData[] {
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
    console.warn('[faqsStorage] Error reading fallback store:', err);
  }
  memoryStore = [...DEFAULT_FAQS];
  saveFallbackStore(memoryStore);
  return memoryStore;
}

function saveFallbackStore(data: FAQItemData[]) {
  memoryStore = data;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[faqsStorage] Error writing fallback store:', err);
  }
}

export async function fetchAllFAQs(): Promise<FAQItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const mongoItems = await (FAQ as any).find({}).sort({ order: 1, createdAt: -1 }).lean();
      if (mongoItems && mongoItems.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (mongoItems || []).map((f: any) => ({
          _id: String(f._id),
          question: String(f.question || ''),
          answer: String(f.answer || ''),
          category: String(f.category || 'General'),
          order: typeof f.order === 'number' ? f.order : 0,
        }));
        saveFallbackStore(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[faqsStorage] MongoDB fetch failed, using fallback store:', err);
  }

  return loadFallbackStore();
}

export async function createNewFAQ(data: Partial<FAQItemData>): Promise<FAQItemData> {
  const newItemData = {
    question: data.question || 'New Question',
    answer: data.answer || '',
    category: data.category || 'General',
    order: typeof data.order === 'number' ? data.order : Date.now(),
  };

  const list = loadFallbackStore();
  const fallbackItem: FAQItemData = {
    _id: `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ...newItemData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.push(fallbackItem);
  saveFallbackStore(list);

  try {
    const db = await connectToDatabase();
    if (db) {
      const created = await (FAQ as any).create(newItemData);
      if (created) {
        fallbackItem._id = String(created._id);
        saveFallbackStore(list);
      }
    }
  } catch (err) {
    console.warn('[faqsStorage] MongoDB create failed, saved to fallback:', err);
  }

  return fallbackItem;
}

export async function updateExistingFAQ(id: string, data: Partial<FAQItemData>): Promise<FAQItemData | null> {
  const list = loadFallbackStore();
  const idx = list.findIndex(f => f._id === id);
  let updatedItem: FAQItemData | null = null;

  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...(data.question && { question: data.question }),
      ...(data.answer && { answer: data.answer }),
      ...(data.category && { category: data.category }),
      ...(typeof data.order === 'number' && { order: data.order }),
      updatedAt: new Date().toISOString(),
    };
    updatedItem = list[idx];
    saveFallbackStore(list);
  }

  try {
    const db = await connectToDatabase();
    if (db) {
      const dbUpdate = {
        ...(data.question && { question: data.question }),
        ...(data.answer && { answer: data.answer }),
        ...(data.category && { category: data.category }),
        ...(typeof data.order === 'number' && { order: data.order }),
      };
      const updated = await (FAQ as any).findByIdAndUpdate(id, dbUpdate, { new: true });
      if (updated) {
        return {
          _id: String(updated._id),
          question: updated.question,
          answer: updated.answer,
          category: updated.category,
          order: updated.order,
        };
      }
    }
  } catch (err) {
    console.warn('[faqsStorage] MongoDB update failed, updated in fallback:', err);
  }

  return updatedItem;
}

export async function deleteExistingFAQ(id: string): Promise<boolean> {
  const list = loadFallbackStore();
  const filtered = list.filter(f => f._id !== id);
  saveFallbackStore(filtered);

  try {
    const db = await connectToDatabase();
    if (db) {
      await (FAQ as any).findByIdAndDelete(id);
    }
  } catch (err) {
    console.warn('[faqsStorage] MongoDB delete failed, deleted from fallback:', err);
  }

  return true;
}
