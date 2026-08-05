import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import SiteConfig from '@/models/SiteConfig';
import BrandSettings from '@/models/BrandSettings';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CORRECT_CONTACT = {
  email: 'photography@indirathakur.com',
  phone: '+91 9819620484',
  location: 'Mumbai, India',
};

function formatConfig(config: any): any {
  if (!config) return {};
  const formatted = { ...config };
  if (!formatted.contact) formatted.contact = {};
  if (!formatted.contact.googleFormUrl) {
    formatted.contact.googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform';
  }
  if (!formatted.contact.email) formatted.contact.email = CORRECT_CONTACT.email;
  if (!formatted.contact.phone) formatted.contact.phone = CORRECT_CONTACT.phone;
  if (!formatted.contact.location) formatted.contact.location = CORRECT_CONTACT.location;

  if (!formatted.footer) formatted.footer = {};
  if (!formatted.footer.email) formatted.footer.email = CORRECT_CONTACT.email;
  if (!formatted.footer.phone) formatted.footer.phone = CORRECT_CONTACT.phone;

  return formatted;
}

export async function GET() {
  try {
    await connectToDatabase();
    const configRaw = await SiteConfig.findOne().lean();
    const config = formatConfig(configRaw || {});
    const brand = await BrandSettings.findOne().lean();

    if (brand) {
      if (!config.footer) config.footer = {};
      if (brand.instagramUrl) config.footer.instagramUrl = brand.instagramUrl;
      if (brand.facebookUrl) config.footer.facebookUrl = brand.facebookUrl;
      if (brand.linkedinUrl) config.footer.linkedinUrl = brand.linkedinUrl;
      if (brand.contactEmail) config.footer.email = brand.contactEmail;
      if (brand.contactPhone) config.footer.phone = brand.contactPhone;

      const unifiedLogo = (config.footer && config.footer.logo && config.footer.logo.url)
        ? config.footer.logo
        : ((brand.logo && brand.logo.url) ? brand.logo : { url: '', alt: '' });
      if (unifiedLogo && unifiedLogo.url) {
        config.footer.logo = unifiedLogo;
      }

      if (brand.defaultOgImage && brand.defaultOgImage.url) {
        if (!config.seo) config.seo = {};
        if (!config.seo.ogImage || !config.seo.ogImage.url) {
          config.seo.ogImage = brand.defaultOgImage;
        }
      }
    }

    return NextResponse.json({ ...config, brand: brand || {} });
  } catch (error) {
    console.error('SiteConfig GET error:', error);
    return NextResponse.json({
      home: {},
      contact: {
        eyebrow: "Let's Create",
        heading: "Begin Your Story",
        description: "Every beautiful photograph begins with a conversation.",
        email: "photography@indirathakur.com",
        phone: "+91 9819620484",
        location: "Mumbai, India",
        googleFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd-LdjuiUE9RSb-rlFMKYj1nJ9az_SQ5RiDeBSTNMQVu5OFYw/viewform",
        socialLinks: []
      },
      footer: {
        tagline: "Photography",
        description: "Documenting life's most precious moments with warmth, artistry, and an unwavering attention to detail.",
        email: "photography@indirathakur.com",
        phone: "+91 9819620484",
        instagramUrl: "https://www.instagram.com/indirathakurphotography/",
        facebookUrl: "https://www.facebook.com",
        linkedinUrl: "",
        logo: { url: '', alt: '' }
      },
      brand: {},
    });
  }
}

export async function PUT(request: Request) {
  try {
    const user = requireAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();

    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;

    const config = await SiteConfig.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    });

    if (body.footer && body.footer.logo && body.footer.logo.url) {
      try {
        await BrandSettings.findOneAndUpdate(
          {},
          { $set: { logo: body.footer.logo } },
          { upsert: true }
        );
      } catch (brandErr) {
        console.warn('Sync footer logo to BrandSettings warning:', brandErr);
      }
    }

    try {
      revalidatePath('/');
      revalidatePath('/gallery');
      revalidatePath('/about');
      revalidatePath('/services');
      revalidatePath('/contact');
      revalidatePath('/admin');
      revalidatePath('/admin/home');
      revalidatePath('/admin/gallery');
      revalidateTag('site-config', 'default');
    } catch (revalErr) {
      console.warn('revalidatePath error:', revalErr);
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('SiteConfig PUT error:', error);
    return NextResponse.json({ error: 'Failed to update site configuration' }, { status: 500 });
  }
}
