import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import { assertNoProhibitedLanguage } from '@/lib/contentPolicy';
import { FooterConfigData, DEFAULT_FOOTER_CONFIG } from '@/types/footer';

export type { FooterConfigData };
export { DEFAULT_FOOTER_CONFIG };

export async function fetchFooterData(): Promise<FooterConfigData> {
  try {
    const db = await connectToDatabase();
    if (db) {
      const configDoc = await SiteConfig.findOne().lean();
      if (configDoc && (configDoc as any).footer) {
        return {
          ...DEFAULT_FOOTER_CONFIG,
          ...((configDoc as any).footer || {}),
        };
      }
      if (configDoc && (configDoc as any).brand) {
        const b = (configDoc as any).brand;
        return {
          ...DEFAULT_FOOTER_CONFIG,
          tagline: b.tagline || DEFAULT_FOOTER_CONFIG.tagline,
          description: b.galleryIntro || DEFAULT_FOOTER_CONFIG.description,
          email: b.contactEmail || b.email || DEFAULT_FOOTER_CONFIG.email,
          phone: b.contactPhone || b.phone || DEFAULT_FOOTER_CONFIG.phone,
          location: b.contactLocation || b.location || DEFAULT_FOOTER_CONFIG.location,
          copyright: b.copyright || DEFAULT_FOOTER_CONFIG.copyright,
          instagramUrl: b.socials?.instagram || b.instagramUrl || DEFAULT_FOOTER_CONFIG.instagramUrl,
          whatsappUrl: b.socials?.whatsapp || b.whatsappUrl || DEFAULT_FOOTER_CONFIG.whatsappUrl,
          youtubeUrl: b.socials?.youtube || b.youtubeUrl || DEFAULT_FOOTER_CONFIG.youtubeUrl,
          facebookUrl: b.socials?.facebook || b.facebookUrl || DEFAULT_FOOTER_CONFIG.facebookUrl,
          linkedinUrl: b.socials?.linkedin || b.linkedinUrl || DEFAULT_FOOTER_CONFIG.linkedinUrl,
          twitterUrl: b.socials?.twitter || b.socials?.x || b.twitterUrl || DEFAULT_FOOTER_CONFIG.twitterUrl,
          pinterestUrl: b.socials?.pinterest || b.pinterestUrl || DEFAULT_FOOTER_CONFIG.pinterestUrl,
          keywords: Array.isArray(b.keywords) && b.keywords.length > 0 ? b.keywords : DEFAULT_FOOTER_CONFIG.keywords,
        };
      }
    }
  } catch (err) {
    console.warn('Database read warning for Footer data:', err);
  }

  return { ...DEFAULT_FOOTER_CONFIG };
}

export async function updateFooterData(data: Partial<FooterConfigData>): Promise<FooterConfigData> {
  assertNoProhibitedLanguage(data);
  const db = await connectToDatabase();
  if (!db) {
    throw new Error('Database connection failed. Unable to persist Footer configuration.');
  }

  const existingConfig = await SiteConfig.findOne().lean();
  const currentFooter = (existingConfig as any)?.footer || {};

  const mergedFooter = {
    ...DEFAULT_FOOTER_CONFIG,
    ...currentFooter,
    ...data,
  };

  const updated = await SiteConfig.findOneAndUpdate(
    {},
    {
      $set: {
        footer: mergedFooter,
        'brand.tagline': mergedFooter.tagline,
        'brand.contactEmail': mergedFooter.email,
        'brand.contactPhone': mergedFooter.phone,
        'brand.contactLocation': mergedFooter.location,
        'brand.copyright': mergedFooter.copyright,
        'brand.socials.instagram': mergedFooter.instagramUrl,
        'brand.socials.whatsapp': mergedFooter.whatsappUrl,
        'brand.socials.youtube': mergedFooter.youtubeUrl,
        'brand.socials.facebook': mergedFooter.facebookUrl,
        'brand.socials.linkedin': mergedFooter.linkedinUrl,
        'brand.socials.twitter': mergedFooter.twitterUrl,
        'brand.socials.pinterest': mergedFooter.pinterestUrl,
      },
    },
    { new: true, upsert: true }
  ).lean();

  return {
    ...DEFAULT_FOOTER_CONFIG,
    ...((updated as any)?.footer || mergedFooter),
  };
}
