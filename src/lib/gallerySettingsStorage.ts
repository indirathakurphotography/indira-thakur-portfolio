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
    const rawCategory = service.category?.trim() || service.title || service.slug || '';
    const newKey = normalizeCategory(rawCategory);
    if (!newKey || newKey === 'all') return;

    const currentSettings = await fetchGallerySettings();
    const currentIntros: Record<string, ICategoryIntro> = {
      ...(currentSettings.categoryIntroductions || DEFAULT_GALLERY_SETTINGS.categoryIntroductions),
    };

    // Find if an existing category intro already exists (by normalized key)
    const existingKey = Object.keys(currentIntros).find((k) => normalizeCategory(k) === newKey);
    let existingIntro: ICategoryIntro | undefined = existingKey ? currentIntros[existingKey] : undefined;

    const derived = deriveCategoryFromService(service);
    const oldKey = oldCategoryKey ? normalizeCategory(oldCategoryKey) : undefined;

    // If an old category key was changed:
    if (oldKey && oldKey !== newKey) {
      if (!existingIntro && currentIntros[oldKey]) {
        existingIntro = currentIntros[oldKey];
      }

      // Check if oldKey should be removed:
      // It should only be removed if:
      // 1. Not a default canonical category
      // 2. Not used by another service
      // 3. Has no gallery images
      const isDefaultOld = Object.keys(DEFAULT_GALLERY_SETTINGS.categoryIntroductions || {}).some(
        (k) => normalizeCategory(k) === oldKey
      );

      if (!isDefaultOld) {
        const db = await connectToDatabase();
        let isUsedByOther = false;
        let hasImages = false;

        if (db) {
          try {
            const ServiceModel = (await import('@/models/Service')).default;
            const otherServices = await ServiceModel.find({
              _id: { $ne: service._id },
            }).lean();
            isUsedByOther = otherServices.some(
              (s: any) => normalizeCategory(s.category || s.title) === oldKey
            );

            const imgCount = await GalleryImage.countDocuments({
              $or: [
                { category: oldKey },
                { category: { $regex: new RegExp(`^${oldKey}$`, 'i') } },
              ],
            }).catch(() => 0);
            hasImages = imgCount > 0;
          } catch (err) {
            console.warn('Error checking other services/images during category sync:', err);
          }
        }

        if (!isUsedByOther && !hasImages) {
          const oldMatchedKey = Object.keys(currentIntros).find((k) => normalizeCategory(k) === oldKey);
          if (oldMatchedKey) {
            delete currentIntros[oldMatchedKey];
          }
        }
      }
    }

    // Handle newKey:
    if (existingIntro) {
      // REUSE the existing category without overwriting its custom content
      if (existingKey && existingKey !== newKey) {
        delete currentIntros[existingKey];
      }
      currentIntros[newKey] = {
        eyebrow: existingIntro.eyebrow || (service.eyebrow?.trim() || derived.eyebrow).toUpperCase(),
        heading: existingIntro.heading || derived.heading,
        description: existingIntro.description || derived.description,
      };
    } else {
      // Genuinely NEW category: create exactly ONE entry
      currentIntros[newKey] = {
        eyebrow: (service.eyebrow?.trim() || service.tagline?.trim() || derived.eyebrow).toUpperCase(),
        heading: derived.heading,
        description: derived.description,
      };
    }

    // Canonicalize all keys in currentIntros to prevent any duplicate keys with different casing
    const sanitizedIntros: Record<string, ICategoryIntro> = {};
    for (const [k, val] of Object.entries(currentIntros)) {
      const canonicalK = normalizeCategory(k);
      if (canonicalK && !sanitizedIntros[canonicalK]) {
        sanitizedIntros[canonicalK] = val;
      }
    }

    // Save back to DB & cache
    const db = await connectToDatabase();
    if (db) {
      await GallerySettings.findOneAndUpdate(
        {},
        { $set: { categoryIntroductions: sanitizedIntros } },
        { new: true, upsert: true }
      );
      await SiteConfig.findOneAndUpdate(
        {},
        { $set: { 'gallerySettings.categoryIntroductions': sanitizedIntros } }
      ).catch(() => null);
    }
    writeLocalFallbackSettings({ categoryIntroductions: sanitizedIntros });

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
 * Preserves gallery images and default categories if any exist.
 */
export async function handleServiceDeletionCategorySync(
  deletedServiceCategory: string,
  otherRemainingServices: { category?: string; title?: string }[]
): Promise<void> {
  try {
    const key = normalizeCategory(deletedServiceCategory);
    if (!key || key === 'all') return;

    // Check if default production category
    const isDefault = Object.keys(DEFAULT_GALLERY_SETTINGS.categoryIntroductions || {}).some(
      (k) => normalizeCategory(k) === key
    );
    if (isDefault) {
      return; // Never delete standard production categories
    }

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
        $or: [
          { category: key },
          { category: { $regex: new RegExp(`^${key}$`, 'i') } },
        ],
      }).catch(() => 0);
      hasImages = imgCount > 0;
    }

    // If NO images use this category and NO other service uses it, remove from categoryIntroductions
    if (!hasImages) {
      const currentSettings = await fetchGallerySettings();
      const currentIntros = { ...(currentSettings.categoryIntroductions || {}) };
      const matchedKey = Object.keys(currentIntros).find((k) => normalizeCategory(k) === key);
      if (matchedKey) {
        delete currentIntros[matchedKey];
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
