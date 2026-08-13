import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import Brand from '@/models/Brand';
import { DEFAULT_BRAND_LOGOS } from '@/lib/defaultBrandLogos';

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

const FALLBACK_FILE_PATH = path.join('/tmp', 'brands_fallback_store.json');

// In-memory cache when MongoDB is unavailable
let memoryStore: BrandItemData[] | null = null;

function loadFallbackStore(): BrandItemData[] {
  if (memoryStore !== null) {
    return memoryStore;
  }
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
    console.warn('[brandStorage] Failed reading fallback store:', err);
  }
  memoryStore = [...APPROVED_BRANDS_DEFAULT];
  saveFallbackStore(memoryStore);
  return memoryStore;
}

function saveFallbackStore(data: BrandItemData[]) {
  memoryStore = data;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[brandStorage] Failed writing fallback store:', err);
  }
}

export async function fetchAllBrands(includeAll = false): Promise<BrandItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const query = includeAll ? {} : { isActive: true };
      const mongoBrands = await Brand.find(query).sort({ displayOrder: 1, createdAt: -1 }).lean();

      if (mongoBrands && mongoBrands.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (mongoBrands || []).map((b: any) => ({
          _id: String(b._id),
          name: String(b.name || ''),
          logo: {
            url: (b.logo as { url?: string })?.url || String(b.logoUrl || ''),
            alt: (b.logo as { alt?: string })?.alt || String(b.name || ''),
          },
          websiteUrl: String(b.websiteUrl || ''),
          category: (b.category as 'Featured In' | 'Trusted By') || 'Featured In',
          displayOrder: typeof b.displayOrder === 'number' ? b.displayOrder : 0,
          isActive: typeof b.isActive === 'boolean' ? b.isActive : true,
          createdAt: b.createdAt ? new Date(b.createdAt as string).toISOString() : undefined,
          updatedAt: b.updatedAt ? new Date(b.updatedAt as string).toISOString() : undefined,
        }));

        saveFallbackStore(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('[brandStorage] MongoDB error, using fallback store:', err);
  }

  // Fallback
  const list = loadFallbackStore();
  return includeAll ? list : list.filter(b => b.isActive);
}

export async function createNewBrand(data: Partial<BrandItemData>): Promise<BrandItemData> {
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

  try {
    const db = await connectToDatabase();
    if (db) {
      const created = await Brand.create(newBrandData);
      return {
        _id: String(created._id),
        name: created.name,
        logo: { url: created.logo?.url || '', alt: created.logo?.alt || '' },
        websiteUrl: created.websiteUrl || '',
        category: created.category as 'Featured In' | 'Trusted By',
        displayOrder: created.displayOrder,
        isActive: created.isActive,
      };
    }
  } catch (err) {
    console.warn('[brandStorage] MongoDB create failed, saving to fallback:', err);
  }

  const list = loadFallbackStore();
  const fallbackBrand: BrandItemData = {
    _id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    ...newBrandData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.push(fallbackBrand);
  saveFallbackStore(list);
  return fallbackBrand;
}

export async function updateExistingBrand(id: string, data: Partial<BrandItemData>): Promise<BrandItemData | null> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const updated = await Brand.findByIdAndUpdate(
        id,
        {
          ...(data.name && { name: data.name }),
          ...(data.logo && { logo: data.logo }),
          ...(typeof data.websiteUrl !== 'undefined' && { websiteUrl: data.websiteUrl }),
          ...(data.category && { category: data.category }),
          ...(typeof data.displayOrder === 'number' && { displayOrder: data.displayOrder }),
          ...(typeof data.isActive === 'boolean' && { isActive: data.isActive }),
        },
        { new: true }
      );
      if (updated) {
        return {
          _id: String(updated._id),
          name: updated.name,
          logo: { url: updated.logo?.url || '', alt: updated.logo?.alt || '' },
          websiteUrl: updated.websiteUrl || '',
          category: updated.category as 'Featured In' | 'Trusted By',
          displayOrder: updated.displayOrder,
          isActive: updated.isActive,
        };
      }
    }
  } catch (err) {
    console.warn('[brandStorage] MongoDB update failed, using fallback:', err);
  }

  const list = loadFallbackStore();
  const idx = list.findIndex(b => b._id === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...(data.name && { name: data.name }),
      ...(data.logo && { logo: { ...list[idx].logo, ...data.logo } }),
      ...(typeof data.websiteUrl !== 'undefined' && { websiteUrl: data.websiteUrl }),
      ...(data.category && { category: data.category }),
      ...(typeof data.displayOrder === 'number' && { displayOrder: data.displayOrder }),
      ...(typeof data.isActive === 'boolean' && { isActive: data.isActive }),
      updatedAt: new Date().toISOString(),
    };
    saveFallbackStore(list);
    return list[idx];
  }

  return null;
}

export async function deleteExistingBrand(id: string): Promise<boolean> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const deleted = await Brand.findByIdAndDelete(id);
      if (deleted) return true;
    }
  } catch (err) {
    console.warn('[brandStorage] MongoDB delete failed, using fallback:', err);
  }

  const list = loadFallbackStore();
  const filtered = list.filter(b => b._id !== id);
  if (filtered.length !== list.length) {
    saveFallbackStore(filtered);
    return true;
  }
  return false;
}

export async function reorderAllBrands(updates: { _id: string; displayOrder: number; isActive?: boolean }[]): Promise<BrandItemData[]> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const promises = updates.map(item =>
        Brand.findByIdAndUpdate(item._id, {
          displayOrder: item.displayOrder,
          ...(typeof item.isActive === 'boolean' ? { isActive: item.isActive } : {}),
        })
      );
      await Promise.all(promises);
      return fetchAllBrands(true);
    }
  } catch (err) {
    console.warn('[brandStorage] MongoDB reorder failed, using fallback:', err);
  }

  const list = loadFallbackStore();
  updates.forEach(u => {
    const item = list.find(b => b._id === u._id);
    if (item) {
      item.displayOrder = u.displayOrder;
      if (typeof u.isActive === 'boolean') item.isActive = u.isActive;
    }
  });

  list.sort((a, b) => a.displayOrder - b.displayOrder);
  saveFallbackStore(list);
  return list;
}
