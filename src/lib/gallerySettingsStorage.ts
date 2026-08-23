import { unstable_cache } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import GallerySettings, { DEFAULT_GALLERY_SETTINGS, IGallerySettings } from '@/models/GallerySettings';
import GalleryImage from '@/models/GalleryImage';
import SiteConfig from '@/models/SiteConfig';
import { deepStripInternalFields } from '@/lib/cmsDatabase';
import { normalizeCategory, formatCategory, deriveCategoryFromService } from '@/lib/categoryUtils';
import type { ICategoryIntro } from '@/types/gallerySettings';

const FALLBACK_FILE_PATH = path.join(process.cwd(), '.gallery-settings-cache.json');

declare global {
  var __gallerySettingsFallback: IGallerySettings | undefined;
}

export function readLocalFallbackSettings(): IGallerySettings {
  if (global.__gallerySettingsFallback) {
    return global.__gallerySettingsFallback;
  }
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const data = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        global.__gallerySettingsFallback = { ...DEFAULT_GALLERY_SETTINGS, ...parsed };
        return global.__gallerySettingsFallback;
      }
    }
  } catch {}
  return DEFAULT_GALLERY_SETTINGS;
}

export function writeLocalFallbackSettings(settings: Partial<IGallerySettings>): IGallerySettings {
  const current = readLocalFallbackSettings();
  const updated = { ...current, ...settings };
  global.__gallerySettingsFallback = updated;
  try {
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch {}
  return updated;
}

export async function fetchGallerySettings(): Promise<IGallerySettings> {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return readLocalFallbackSettings();
    }

    let settingsDoc: any = await GallerySettings.findOne().lean().catch(() => null);

    if (!settingsDoc) {
      const siteConfigDoc: any = await SiteConfig.findOne().lean().catch(() => null);
      if (siteConfigDoc?.gallerySettings) {
        settingsDoc = siteConfigDoc.gallerySettings;
      }
    }

    if (!settingsDoc) {
      return readLocalFallbackSettings();
    }

    const cleaned = deepStripInternalFields(settingsDoc);
    const resolved = {
      ...DEFAULT_GALLERY_SETTINGS,
      ...cleaned,
    };
    writeLocalFallbackSettings(resolved);
    return resolved;
  } catch (error) {
    console.error('fetchGallerySettings error:', error);
    return readLocalFallbackSettings();
  }
}

export const getCachedGallerySettings = unstable_cache(
  async () => fetchGallerySettings(),
  ['public-gallery-settings'],
  {
    revalidate: 300,
    tags: ['gallery', 'site-config'],
  }
);

/**
 * Synchronizes GallerySettings.categoryIntroductions whenever a Service is created or updated.
 * - Idempotent: Does not create duplicate categories.
 * - Preserves custom gallery narratives (heading, description).
 * - Automatically assigns derived values if no custom values exist.
 */
export async function syncGalleryCategoryFromService(
  service: {
    _id?: string;
    title?: string;
    slug?: string;
    category?: string;
    eyebrow?: string;
    tagline?: string;
    description?: string;
  },
  oldCategoryKey?: string
): Promise<void> {
  try {
    const derived = deriveCategoryFromService(service);
    const newKey = derived.key;
    if (!newKey || newKey === 'all') return;

    const currentSettings = await fetchGallerySettings();
    const currentIntros: Record<string, ICategoryIntro> = {
      ...(currentSettings.categoryIntroductions || DEFAULT_GALLERY_SETTINGS.categoryIntroductions),
    };

    const oldKey = oldCategoryKey ? normalizeCategory(oldCategoryKey) : undefined;

    // Check if old key had custom narrative to migrate
    let existingIntro: ICategoryIntro | undefined = currentIntros[newKey];
    if (!existingIntro && oldKey && currentIntros[oldKey]) {
      existingIntro = currentIntros[oldKey];
      // Clean up old key if it differed and isn't 'all'
      if (oldKey !== newKey && oldKey !== 'all') {
        delete currentIntros[oldKey];
      }
    }

    if (existingIntro) {
      // Preserve explicit heading and description, update eyebrow if provided by service
      currentIntros[newKey] = {
        eyebrow: service.eyebrow?.trim() || existingIntro.eyebrow || derived.eyebrow,
        heading: existingIntro.heading || derived.heading,
        description: existingIntro.description || derived.description,
      };
    } else {
      // Create new category narrative entry
      currentIntros[newKey] = {
        eyebrow: derived.eyebrow,
        heading: derived.heading,
        description: derived.description,
      };
    }

    // Save back to DB & cache
    const db = await connectToDatabase();
    if (db) {
      await GallerySettings.findOneAndUpdate(
        {},
        { $set: { categoryIntroductions: currentIntros } },
        { new: true, upsert: true }
      );
      await SiteConfig.findOneAndUpdate(
        {},
        { $set: { 'gallerySettings.categoryIntroductions': currentIntros } }
      ).catch(() => null);
    }
    writeLocalFallbackSettings({ categoryIntroductions: currentIntros });

    // If category key changed on the service, also update any existing gallery images with old key
    if (oldKey && oldKey !== newKey && db) {
      await GalleryImage.updateMany(
        { category: { $regex: new RegExp(`^${oldKey}$`, 'i') } },
        { $set: { category: newKey } }
      ).catch((e) => console.warn('Could not reassign old category images on service update:', e));
    }
  } catch (err) {
    console.error('Error in syncGalleryCategoryFromService:', err);
  }
}

/**
 * Cleans up or detaches a Gallery category when a Service is deleted.
 * Preserves gallery images if any exist.
 */
export async function handleServiceDeletionCategorySync(
  deletedServiceCategory: string,
  otherRemainingServices: { category?: string; title?: string }[]
): Promise<void> {
  try {
    const key = normalizeCategory(deletedServiceCategory);
    if (!key || key === 'all') return;

    // Check if any other remaining service uses the same category
    const isUsedByOtherService = otherRemainingServices.some((s) => {
      const sKey = normalizeCategory(s.category || s.title);
      return sKey === key;
    });

    if (isUsedByOtherService) {
      return; // Still needed by another service
    }

    // Check if any gallery images use this category
    const db = await connectToDatabase();
    let hasImages = false;
    if (db) {
      const imgCount = await GalleryImage.countDocuments({
        category: { $regex: new RegExp(`^${key}$`, 'i') },
      }).catch(() => 0);
      hasImages = imgCount > 0;
    }

    // If NO images use this category and NO other service uses it, remove from categoryIntroductions
    if (!hasImages) {
      const currentSettings = await fetchGallerySettings();
      const currentIntros = { ...(currentSettings.categoryIntroductions || {}) };
      if (currentIntros[key]) {
        delete currentIntros[key];
        if (db) {
          await GallerySettings.findOneAndUpdate(
            {},
            { $set: { categoryIntroductions: currentIntros } }
          );
        }
        writeLocalFallbackSettings({ categoryIntroductions: currentIntros });
      }
    }
  } catch (err) {
    console.error('Error in handleServiceDeletionCategorySync:', err);
  }
}

/**
 * Removes a custom/manual category from GallerySettings.
 */
export async function deleteCustomGalleryCategory(categoryKey: string): Promise<boolean> {
  const norm = normalizeCategory(categoryKey);
  if (!norm || norm === 'all') return false;

  try {
    const currentSettings = await fetchGallerySettings();
    const currentIntros = { ...(currentSettings.categoryIntroductions || {}) };
    if (currentIntros[norm]) {
      delete currentIntros[norm];
      const db = await connectToDatabase();
      if (db) {
        await GallerySettings.findOneAndUpdate(
          {},
          { $set: { categoryIntroductions: currentIntros } }
        );
        await SiteConfig.findOneAndUpdate(
          {},
          { $set: { 'gallerySettings.categoryIntroductions': currentIntros } }
        ).catch(() => null);
      }
      writeLocalFallbackSettings({ categoryIntroductions: currentIntros });
      return true;
    }
  } catch (err) {
    console.error('Error deleting custom gallery category:', err);
  }
  return false;
}
