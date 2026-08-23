import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import GallerySettings, { DEFAULT_GALLERY_SETTINGS } from '@/models/GallerySettings';
import SiteConfig from '@/models/SiteConfig';
import { triggerRevalidation } from '@/lib/revalidate';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { deepStripInternalFields } from '@/lib/cmsDatabase';
import { fetchGallerySettings, writeLocalFallbackSettings } from '@/lib/gallerySettingsStorage';
import { normalizeCategory } from '@/lib/categoryUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const settings = await fetchGallerySettings();
    return NextResponse.json(settings, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error fetching gallery settings:', error);
    return NextResponse.json(DEFAULT_GALLERY_SETTINGS, { headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    assertNoProhibitedLanguage(body);

    // Sanitize categoryIntroductions
    const categoryIntroductions: Record<string, { eyebrow: string; heading: string; description: string }> = {};
    if (body.categoryIntroductions && typeof body.categoryIntroductions === 'object') {
      for (const [key, val] of Object.entries(body.categoryIntroductions)) {
        if (!key || typeof val !== 'object' || !val) continue;
        const normKey = normalizeCategory(key) || key.toLowerCase().trim();
        const intro = val as any;
        categoryIntroductions[normKey] = {
          eyebrow: typeof intro.eyebrow === 'string' ? intro.eyebrow : '',
          heading: typeof intro.heading === 'string' ? intro.heading : '',
          description: typeof intro.description === 'string' ? intro.description : '',
        };
      }
    }

    // Clean payload
    const payloadToSave = {
      eyebrow: typeof body.eyebrow === 'string'
        ? body.eyebrow
        : (categoryIntroductions.all?.eyebrow ?? DEFAULT_GALLERY_SETTINGS.eyebrow),
      heading: typeof body.heading === 'string'
        ? body.heading
        : (categoryIntroductions.all?.heading ?? DEFAULT_GALLERY_SETTINGS.heading),
      subtitle: typeof body.subtitle === 'string'
        ? body.subtitle
        : (categoryIntroductions.all?.description ?? DEFAULT_GALLERY_SETTINGS.subtitle),
      categoryIntroductions: Object.keys(categoryIntroductions).length > 0
        ? categoryIntroductions
        : (body.categoryIntroductions || DEFAULT_GALLERY_SETTINGS.categoryIntroductions),
      displayStyle: body.displayStyle || DEFAULT_GALLERY_SETTINGS.displayStyle,
      imageInteraction: body.imageInteraction || DEFAULT_GALLERY_SETTINGS.imageInteraction,
      clickBehavior: body.clickBehavior || DEFAULT_GALLERY_SETTINGS.clickBehavior,
      aspectRatio: body.aspectRatio || DEFAULT_GALLERY_SETTINGS.aspectRatio,
      desktopColumns: typeof body.desktopColumns === 'number' ? body.desktopColumns : Number(body.desktopColumns) || DEFAULT_GALLERY_SETTINGS.desktopColumns,
      tabletColumns: typeof body.tabletColumns === 'number' ? body.tabletColumns : Number(body.tabletColumns) || DEFAULT_GALLERY_SETTINGS.tabletColumns,
      mobileColumns: typeof body.mobileColumns === 'number' ? body.mobileColumns : Number(body.mobileColumns) || DEFAULT_GALLERY_SETTINGS.mobileColumns,
      imageGap: body.imageGap || DEFAULT_GALLERY_SETTINGS.imageGap,
      borderRadius: body.borderRadius || DEFAULT_GALLERY_SETTINGS.borderRadius,
      categoryStyle: body.categoryStyle || body.categoryFilterStyle || DEFAULT_GALLERY_SETTINGS.categoryStyle,
      headerAlignment: body.headerAlignment || DEFAULT_GALLERY_SETTINGS.headerAlignment,
      headerSpacing: body.headerSpacing || DEFAULT_GALLERY_SETTINGS.headerSpacing,
      introWidth: body.introWidth || DEFAULT_GALLERY_SETTINGS.introWidth,
      thumbnailSize: body.thumbnailSize || DEFAULT_GALLERY_SETTINGS.thumbnailSize || 'normal',
      customThumbnailSize: typeof body.customThumbnailSize === 'number' ? body.customThumbnailSize : (body.customThumbnailSize ? Number(body.customThumbnailSize) : undefined),
      fontFamily: body.fontFamily || DEFAULT_GALLERY_SETTINGS.fontFamily || 'serif',
      headingSize: body.headingSize || DEFAULT_GALLERY_SETTINGS.headingSize || 'normal',
      eyebrowColor: body.eyebrowColor || DEFAULT_GALLERY_SETTINGS.eyebrowColor || '#C39E96',
      headingColor: body.headingColor || DEFAULT_GALLERY_SETTINGS.headingColor || '#2B2625',
      subtitleColor: body.subtitleColor || DEFAULT_GALLERY_SETTINGS.subtitleColor || '#6D625F',
      eyebrowTypography: body.eyebrowTypography,
      headingTypography: body.headingTypography,
      subtitleTypography: body.subtitleTypography,
      customTypographies: body.customTypographies,
    };

    const db = await connectToDatabase();
    if (db) {
      // 1. Update or create GallerySettings document
      await GallerySettings.findOneAndUpdate(
        {},
        { $set: payloadToSave },
        { new: true, upsert: true, runValidators: false }
      );

      // 2. Also keep SiteConfig.gallerySettings synchronized
      await SiteConfig.findOneAndUpdate(
        {},
        { $set: { gallerySettings: payloadToSave } },
        { upsert: false }
      ).catch(() => null);

      // 3. Read-after-write verification
      const verifiedDoc: any = await GallerySettings.findOne().lean();
      if (!verifiedDoc) {
        throw new Error('Read-after-write verification failed: GallerySettings not found after save.');
      }
    }

    // Always update local fallback cache so runtime and SSR stay immediately synced
    const saved = writeLocalFallbackSettings(payloadToSave);

    // 4. Trigger revalidation
    triggerRevalidation();

    const responseData = {
      ...DEFAULT_GALLERY_SETTINGS,
      ...saved,
    };

    return NextResponse.json(responseData, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error updating gallery settings:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save gallery settings' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
