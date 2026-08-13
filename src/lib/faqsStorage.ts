import { connectToDatabase } from '@/lib/mongodb';
import FAQ from '@/models/FAQ';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';

const FAQModel = FAQ as any;

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

function mapFAQ(doc: any): FAQItemData {
  return {
    _id: String(doc._id),
    question: String(doc.question || ''),
    answer: String(doc.answer || ''),
    category: String(doc.category || 'General'),
    order: typeof doc.order === 'number' ? doc.order : 0,
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
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to persist FAQ.');
  }

  const newItemData = {
    question: data.question || 'New Question',
    answer: data.answer || '',
    category: data.category || 'General',
    order: typeof data.order === 'number' ? data.order : Date.now(),
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
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to update FAQ.');
  }

  const objectId = parseObjectId(id);
  const dbUpdate: any = {
    ...(data.question && { question: data.question }),
    ...(data.answer && { answer: data.answer }),
    ...(data.category && { category: data.category }),
    ...(typeof data.order === 'number' && { order: data.order }),
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
