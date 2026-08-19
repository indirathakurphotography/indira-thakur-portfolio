import { unstable_cache } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import GallerySettings, { DEFAULT_GALLERY_SETTINGS, IGallerySettings } from '@/models/GallerySettings';
import SiteConfig from '@/models/SiteConfig';
import { deepStripInternalFields } from '@/lib/cmsDatabase';

export async function fetchGallerySettings(): Promise<IGallerySettings> {
  try {
    const db = await connectToDatabase();
    if (!db) {
      return DEFAULT_GALLERY_SETTINGS;
    }

    let settingsDoc: any = await GallerySettings.findOne().lean().catch(() => null);

    if (!settingsDoc) {
      const siteConfigDoc: any = await SiteConfig.findOne().lean().catch(() => null);
      if (siteConfigDoc?.gallerySettings) {
        settingsDoc = siteConfigDoc.gallerySettings;
      }
    }

    if (!settingsDoc) {
      return DEFAULT_GALLERY_SETTINGS;
    }

    const cleaned = deepStripInternalFields(settingsDoc);
    return {
      ...DEFAULT_GALLERY_SETTINGS,
      ...cleaned,
    };
  } catch (error) {
    console.error('fetchGallerySettings error:', error);
    return DEFAULT_GALLERY_SETTINGS;
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
