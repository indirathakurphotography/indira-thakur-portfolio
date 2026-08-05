import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import BrandSettings from '@/models/BrandSettings';
import SiteConfig from '@/models/SiteConfig';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const SINGLE_SOURCE_OF_TRUTH = {
  contactEmail: 'photography@indirathakur.com',
  contactPhone: '+91 9819620484',
  contactLocation: 'Mumbai, India',
  instagramUrl: 'https://www.instagram.com/indirathakurphotography/',
  facebookUrl: 'https://www.facebook.com',
  linkedinUrl: 'https://www.linkedin.com',
  defaultOgImage: {
    url: '',
    alt: 'Indira Thakur Photography OG',
  },
};

export async function GET() {
  try {
    await connectToDatabase();
    let brand = await BrandSettings.findOne();
    if (!brand) {
      brand = await BrandSettings.create(SINGLE_SOURCE_OF_TRUTH);
    } else {
      let dirty = false;
      if (!brand.contactEmail || brand.contactEmail.includes('hello@') || brand.contactLocation?.includes('Bangalore')) {
        brand.contactEmail = SINGLE_SOURCE_OF_TRUTH.contactEmail;
        brand.contactPhone = SINGLE_SOURCE_OF_TRUTH.contactPhone;
        brand.contactLocation = SINGLE_SOURCE_OF_TRUTH.contactLocation;
        dirty = true;
      }
      if (!brand.instagramUrl) {
        brand.instagramUrl = SINGLE_SOURCE_OF_TRUTH.instagramUrl;
        dirty = true;
      }
      if (!brand.linkedinUrl) {
        brand.linkedinUrl = SINGLE_SOURCE_OF_TRUTH.linkedinUrl;
        dirty = true;
      }
      if (!brand.defaultOgImage) {
        brand.defaultOgImage = SINGLE_SOURCE_OF_TRUTH.defaultOgImage;
        dirty = true;
      }
      if (dirty) {
        await brand.save();
      }
    }
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Brand GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await request.json();

    const brand = await BrandSettings.findOneAndUpdate({}, body, { new: true, upsert: true });

    // Sync into SiteConfig so there is only one source of truth across all components
    try {
      const siteConfig = await SiteConfig.findOne();
      if (siteConfig) {
        if (!siteConfig.contact) siteConfig.contact = {};
        if (!siteConfig.footer) siteConfig.footer = {};
        if (!siteConfig.seo) siteConfig.seo = {};

        siteConfig.contact.email = body.contactEmail || SINGLE_SOURCE_OF_TRUTH.contactEmail;
        siteConfig.contact.phone = body.contactPhone || SINGLE_SOURCE_OF_TRUTH.contactPhone;
        siteConfig.contact.location = body.contactLocation || SINGLE_SOURCE_OF_TRUTH.contactLocation;

        siteConfig.footer.email = body.contactEmail || SINGLE_SOURCE_OF_TRUTH.contactEmail;
        siteConfig.footer.phone = body.contactPhone || SINGLE_SOURCE_OF_TRUTH.contactPhone;
        if (body.instagramUrl) siteConfig.footer.instagramUrl = body.instagramUrl;
        if (body.facebookUrl) siteConfig.footer.facebookUrl = body.facebookUrl;
        if (body.linkedinUrl) siteConfig.footer.linkedinUrl = body.linkedinUrl;

        if (body.defaultOgImage && body.defaultOgImage.url) {
          siteConfig.seo.ogImage = body.defaultOgImage;
        }

        if (body.logo) {
          siteConfig.footer.logo = body.logo;
        }

        siteConfig.brand = {
          siteName: body.siteName || 'Indira Thakur Photography',
          tagline: body.tagline || "Capturing Life's Precious Moments",
          logo: body.logo || { url: '', alt: '' },
          preloaderLogo: body.preloaderLogo || { url: '', alt: '' },
          favicon: body.favicon || { url: '', alt: '' },
        };

        await siteConfig.save();
      }
    } catch (syncErr) {
      console.warn('Sync brand -> siteConfig warning:', syncErr);
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error('Brand PUT error:', error);
    return NextResponse.json({ error: 'Failed to update brand settings' }, { status: 500 });
  }
}
