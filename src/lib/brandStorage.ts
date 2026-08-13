import { connectToDatabase } from '@/lib/mongodb';
import Brand from '@/models/Brand';
import { DEFAULT_BRAND_LOGOS } from '@/lib/defaultBrandLogos';
import { ApiError, parseObjectId } from '@/lib/cmsDatabase';

export interface BrandItemData {
  _id: string;
  name: string;
  logo: {
    url: string;
    alt?: string;
  };
  websiteUrl?: string;
  category: 'Featured In' | 'Trusted By';
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const APPROVED_BRANDS_DEFAULT: BrandItemData[] = [
  {
    _id: 'brand-night-night',
    name: 'Night Night',
    logo: { url: DEFAULT_BRAND_LOGOS.nightNight, alt: 'Night Night' },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 0,
    isActive: true,
  },
  {
    _id: 'brand-manbhari-sarees',
    name: 'Manbhari Sarees',
    logo: { url: DEFAULT_BRAND_LOGOS.manbhariSarees, alt: 'Manbhari Sarees' },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 1,
    isActive: true,
  },
  {
    _id: 'brand-reeora',
    name: 'Reeora',
    logo: { url: DEFAULT_BRAND_LOGOS.reeora, alt: 'Reeora' },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 2,
    isActive: true,
  },
  {
    _id: 'brand-indie-loom',
    name: 'Indie Loom',
    logo: { url: DEFAULT_BRAND_LOGOS.indieLoom, alt: 'Indie Loom' },
    websiteUrl: '',
    category: 'Featured In',
    displayOrder: 3,
    isActive: true,
  },
];

function mapBrand(doc: any): BrandItemData {
  return {
    _id: String(doc._id),
    name: String(doc.name || ''),
    logo: {
      url: (doc.logo as { url?: string })?.url || String(doc.logoUrl || ''),
      alt: (doc.logo as { alt?: string })?.alt || String(doc.name || ''),
    },
    websiteUrl: String(doc.websiteUrl || ''),
    category: (doc.category as 'Featured In' | 'Trusted By') || 'Featured In',
    displayOrder: typeof doc.displayOrder === 'number' ? doc.displayOrder : 0,
    isActive: typeof doc.isActive === 'boolean' ? doc.isActive : true,
    createdAt: doc.createdAt ? new Date(doc.createdAt as string).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string).toISOString() : undefined,
  };
}

export async function fetchAllBrands(includeAll = false): Promise<BrandItemData[]> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to read brands.');
  }

  const query = includeAll ? {} : { isActive: true };
  const mongoBrands = await Brand.find(query).sort({ displayOrder: 1, createdAt: -1 }).lean();
  return (mongoBrands || []).map(mapBrand);
}

export async function createNewBrand(data: Partial<BrandItemData>): Promise<BrandItemData> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to persist brand.');
  }

  const newBrandData = {
    name: data.name || 'New Brand',
    logo: {
      url: data.logo?.url || '',
      alt: data.logo?.alt || data.name || '',
    },
    websiteUrl: data.websiteUrl || '',
    category: data.category || 'Featured In',
    displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : Date.now(),
    isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
  };

  const created: any = await Brand.create(newBrandData);

  // Read-after-write verification
  const fresh: any = await Brand.findById(created._id).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: created brand was not found in MongoDB.');
  }

  return mapBrand(fresh);
}

export async function updateExistingBrand(id: string, data: Partial<BrandItemData>): Promise<BrandItemData> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to update brand.');
  }

  const objectId = parseObjectId(id);
  const dbUpdate: any = {
    ...(data.name && { name: data.name }),
    ...(data.logo && { logo: data.logo }),
    ...(typeof data.websiteUrl !== 'undefined' && { websiteUrl: data.websiteUrl }),
    ...(data.category && { category: data.category }),
    ...(typeof data.displayOrder === 'number' && { displayOrder: data.displayOrder }),
    ...(typeof data.isActive === 'boolean' && { isActive: data.isActive }),
  };

  const updated: any = await Brand.findByIdAndUpdate(objectId, dbUpdate, { new: true }).lean();
  if (!updated) {
    throw new ApiError('Brand not found', 404);
  }

  // Read-after-write verification
  const fresh: any = await Brand.findById(objectId).lean();
  if (!fresh) {
    throw new Error('Read-after-write verification failed: updated brand was not found in MongoDB.');
  }

  return mapBrand(fresh);
}

export async function deleteExistingBrand(id: string): Promise<boolean> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to delete brand.');
  }

  const objectId = parseObjectId(id);
  const deleted = await Brand.deleteOne({ _id: objectId });
  if (deleted.deletedCount !== 1) {
    throw new ApiError('Brand not found', 404);
  }

  // Delete verification
  const check = await Brand.findById(objectId).lean();
  if (check) {
    throw new Error('Delete verification failed: brand still exists in MongoDB.');
  }

  return true;
}

export async function reorderAllBrands(
  updates: { _id: string; displayOrder: number; isActive?: boolean }[]
): Promise<BrandItemData[]> {
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection unavailable. Unable to reorder brands.');
  }

  for (const item of updates || []) {
    const objectId = parseObjectId(item._id);
    const dbUpdate: any = {
      displayOrder: item.displayOrder,
      ...(typeof item.isActive === 'boolean' ? { isActive: item.isActive } : {}),
    };
    const updated = await Brand.findByIdAndUpdate(objectId, dbUpdate, { new: true }).lean();
    if (!updated) {
      throw new ApiError(`Brand not found: ${item._id}`, 404);
    }
  }

  // Reorder verification: read back and confirm ordering applied
  const reordered = await fetchAllBrands(true);
  const orderMap = new Map((updates || []).map((u) => [u._id, u.displayOrder]));
  for (const item of updates || []) {
    const fresh = reordered.find((b) => b._id === item._id);
    if (!fresh || fresh.displayOrder !== orderMap.get(item._id)) {
      throw new Error('Read-after-write verification failed: brand reorder was not persisted in MongoDB.');
    }
  }

  return reordered;
}
