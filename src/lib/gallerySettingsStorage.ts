import { unstable_cache } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import GallerySettings, { DEFAULT_GALLERY_SETTINGS, IGallerySettings } from '@/models/GallerySettings';
import SiteConfig from '@/models/SiteConfig';
import { deepStripInternalFields } from '@/lib/cmsDatabase';

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
